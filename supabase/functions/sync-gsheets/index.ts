import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  sourceId: string;
}

interface GSheetsConfig {
  sheetId: string;
  sheetName?: string;
  headerRow?: number;
  fieldMapping: Record<string, string>;
}

interface OAuthToken {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  user_email: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

function extractSheetId(urlOrId: string): string {
  if (!urlOrId.includes('/')) {
    return urlOrId;
  }
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const parseRow = (row: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// deno-lint-ignore no-explicit-any
async function getValidAccessToken(supabase: any): Promise<string | null> {
  // Get stored OAuth token
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenError || !tokenData) {
    console.log('No OAuth token found, will use public CSV method');
    return null;
  }

  const token = tokenData as OAuthToken;
  const expiresAt = new Date(token.expires_at);
  
  // If token is still valid (with 5 minute buffer)
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return token.access_token;
  }

  // Token expired, try to refresh
  if (token.refresh_token && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log('Refreshing expired access token...');
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('Token refresh failed:', tokens.error);
        return null;
      }

      // Update token in database
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      await supabase
        .from('google_oauth_tokens')
        .update({
          access_token: tokens.access_token,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('user_email', token.user_email);

      return tokens.access_token;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return null;
    }
  }

  console.log('Token expired and cannot be refreshed');
  return null;
}

async function fetchSheetWithAPI(sheetId: string, accessToken: string, sheetName?: string): Promise<Record<string, string>[] | null> {
  try {
    const range = sheetName ? encodeURIComponent(sheetName) : 'Sheet1';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    
    console.log('Fetching sheet via API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sheets API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const values = data.values as string[][];

    if (!values || values.length < 2) {
      return [];
    }

    const headers = values[0];
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < values.length; i++) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[i][index] || '';
      });
      rows.push(row);
    }

    return rows;
  } catch (err) {
    console.error('Sheets API fetch error:', err);
    return null;
  }
}

async function fetchSheetWithCSV(sheetId: string): Promise<{ rows: Record<string, string>[] | null; error?: string }> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  
  console.log('Fetching sheet via public CSV:', csvUrl);
  
  const response = await fetch(csvUrl);

  if (!response.ok) {
    console.error('CSV fetch error:', response.status, response.statusText);
    return { 
      rows: null, 
      error: 'Failed to fetch Google Sheet. Make sure the sheet is publicly accessible (Anyone with the link can view), or connect your Google account in Settings.' 
    };
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);
  return { rows };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { sourceId }: SyncRequest = await req.json();

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch source configuration
    const { data: source, error: sourceError } = await supabase
      .from('deal_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: 'Deal source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = source.config as GSheetsConfig;
    const sheetId = extractSheetId(config.sheetId);
    
    console.log('Syncing Google Sheet:', sheetId);

    // Try OAuth API first, fall back to public CSV
    let rows: Record<string, string>[] | null = null;
    let fetchError: string | undefined;
    
    const accessToken = await getValidAccessToken(supabase);
    
    if (accessToken) {
      console.log('Using OAuth API access...');
      rows = await fetchSheetWithAPI(sheetId, accessToken, config.sheetName);
      
      if (rows === null) {
        console.log('API fetch failed, falling back to public CSV...');
      }
    }
    
    // Fall back to public CSV if API didn't work
    if (rows === null) {
      console.log('Using public CSV access...');
      const csvResult = await fetchSheetWithCSV(sheetId);
      rows = csvResult.rows;
      fetchError = csvResult.error;
    }

    if (rows === null) {
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'error' })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ error: fetchError || 'Failed to fetch sheet data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetched rows:', rows.length);

    if (rows.length === 0) {
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'success', last_sync_at: new Date().toISOString() })
        .eq('id', sourceId);
      
      return new Response(
        JSON.stringify({ dealsCreated: 0, dealsUpdated: 0, dealsFailed: 0, errors: [], message: 'No data found in sheet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default field mapping based on common sheet structures
    const fieldMapping = config.fieldMapping || {
      name: 'Startup Name',
      sector: 'Industry',
      valuation: 'Valuation (USD)',
      description: 'Key Product/Service',
      pitch_deck_url: 'Pitch Deck (Link)',
    };

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowId = `row_${i + 2}`; // +2 because data is 0-indexed and we skip header

      try {
        // Get the startup name (required field)
        const nameField = fieldMapping.name || 'Startup Name';
        const name = row[nameField];
        
        if (!name || name.trim() === '') {
          console.log('Skipping row without name');
          continue;
        }

        const dealData: Record<string, unknown> = {
          name: name.trim(),
          source_type: 'gsheets',
          source_id: `${sheetId}_${rowId}`,
          stage: 'sourcing',
        };

        // Map other fields
        if (fieldMapping.sector && row[fieldMapping.sector]) {
          dealData.sector = row[fieldMapping.sector];
        }
        if (fieldMapping.description && row[fieldMapping.description]) {
          dealData.description = row[fieldMapping.description];
        }
        if (fieldMapping.website_url && row[fieldMapping.website_url]) {
          const url = row[fieldMapping.website_url];
          if (url.startsWith('http')) {
            dealData.website_url = url;
          }
        }
        if (fieldMapping.valuation && row[fieldMapping.valuation]) {
          const valuation = parseFloat(row[fieldMapping.valuation].replace(/[^0-9.]/g, ''));
          if (!isNaN(valuation)) {
            dealData.valuation = valuation;
          }
        }
        if (fieldMapping.ask_amount && row[fieldMapping.ask_amount]) {
          const askAmount = parseFloat(row[fieldMapping.ask_amount].replace(/[^0-9.]/g, ''));
          if (!isNaN(askAmount)) {
            dealData.ask_amount = askAmount;
          }
        }
        if (fieldMapping.pitch_deck_url && row[fieldMapping.pitch_deck_url]) {
          const url = row[fieldMapping.pitch_deck_url];
          if (url.startsWith('http')) {
            dealData.pitch_deck_url = url;
          }
        }
        if (fieldMapping.founder_email && row[fieldMapping.founder_email]) {
          dealData.founder_email = row[fieldMapping.founder_email];
        }
        if (fieldMapping.founder_name && row[fieldMapping.founder_name]) {
          dealData.founder_name = row[fieldMapping.founder_name];
        }

        // Check if deal already exists
        const { data: existing } = await supabase
          .from('pipeline_deals')
          .select('id')
          .eq('source_id', `${sheetId}_${rowId}`)
          .single();

        if (existing) {
          const { error: updateError } = await supabase
            .from('pipeline_deals')
            .update(dealData)
            .eq('id', existing.id);

          if (updateError) throw updateError;
          dealsUpdated++;
        } else {
          const { error: insertError } = await supabase
            .from('pipeline_deals')
            .insert(dealData);

          if (insertError) throw insertError;
          dealsCreated++;
        }
      } catch (error: unknown) {
        dealsFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 2}: ${message}`);
        console.error(`Error processing row ${i + 2}:`, error);
      }
    }

    // Update source sync status
    await supabase
      .from('deal_sources')
      .update({
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    console.log(`Sync complete: ${dealsCreated} created, ${dealsUpdated} updated, ${dealsFailed} failed`);

    return new Response(
      JSON.stringify({
        sourceId,
        syncedAt: new Date().toISOString(),
        dealsCreated,
        dealsUpdated,
        dealsFailed,
        errors,
        method: accessToken ? 'oauth_api' : 'public_csv',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
