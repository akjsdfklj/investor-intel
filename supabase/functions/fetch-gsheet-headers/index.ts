import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

function extractSheetId(urlOrId: string): string {
  if (!urlOrId.includes('/')) return urlOrId;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}

function parseCSV(csvText: string): string[] {
  const firstLine = csvText.split('\n')[0] || '';
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else current += char;
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values.filter(v => v.length > 0);
}

// deno-lint-ignore no-explicit-any
async function getValidAccessToken(supabase: any): Promise<string | null> {
  const { data: tokenData } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!tokenData) return null;

  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) return tokenData.access_token;

  if (tokenData.refresh_token && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      const tokens = await res.json();
      if (tokens.error) return null;
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      await supabase
        .from('google_oauth_tokens')
        .update({ access_token: tokens.access_token, expires_at: newExpiresAt.toISOString() })
        .eq('user_email', tokenData.user_email);
      return tokens.access_token;
    } catch {
      return null;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { sourceId, sheetUrl, sheetName } = await req.json();

    let sheetId: string;
    let resolvedSheetName: string | undefined = sheetName;

    if (sourceId) {
      const { data: source } = await supabase
        .from('deal_sources')
        .select('config')
        .eq('id', sourceId)
        .single();
      if (!source) {
        return new Response(JSON.stringify({ error: 'Source not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // deno-lint-ignore no-explicit-any
      const cfg = source.config as any;
      sheetId = extractSheetId(cfg.sheetId);
      resolvedSheetName = resolvedSheetName || cfg.sheetName;
    } else if (sheetUrl) {
      sheetId = extractSheetId(sheetUrl);
    } else {
      return new Response(JSON.stringify({ error: 'sourceId or sheetUrl required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let headers: string[] = [];
    const accessToken = await getValidAccessToken(supabase);

    if (accessToken) {
      const range = resolvedSheetName ? `${resolvedSheetName}!1:1` : '1:1';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        headers = (data.values?.[0] as string[]) || [];
      }
    }

    if (headers.length === 0) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      const res = await fetch(csvUrl);
      if (res.ok) {
        headers = parseCSV(await res.text());
      }
    }

    if (headers.length === 0) {
      return new Response(JSON.stringify({
        error: 'Could not fetch headers. Ensure the sheet is shared publicly or connect Google in Settings.',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ headers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
