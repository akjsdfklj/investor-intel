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

// Column name fallbacks for flexible matching
const COLUMN_FALLBACKS: Record<string, string[]> = {
  name: ['Company Name', 'Startup Name', 'Name', 'Company', 'Startup', 'Title', 'Startup/Company Name', 'Organization'],
  website_url: ['Website', 'Website URL', 'URL', 'Site', 'Web', 'Homepage', 'Company Website'],
  description: ['Description', 'Key Product/Service', 'Product', 'Service', 'About', 'Summary', 'Overview', 'What they do'],
  sector: ['Sector', 'Industry', 'Category', 'Vertical', 'Space', 'Market', 'Domain'],
  founder_name: ['Founder', 'Founder Name', 'Founders', 'CEO', 'Team Lead', 'Contact Name', 'Contact'],
  founder_email: ['Email', 'Founder Email', 'Contact Email', 'E-mail', 'Mail'],
  valuation: ['Valuation', 'Valuation (USD)', 'Current Valuation', 'Pre-Money Valuation', 'Post-Money Valuation'],
  ask_amount: ['Ask', 'Ask Amount', 'Raise', 'Raising', 'Funding Ask', 'Investment Ask', 'Amount Raising', 'Raise Amount'],
  pitch_deck_url: ['Pitch Deck', 'Pitch Deck (Link)', 'Deck', 'Deck URL', 'Deck Link', 'Presentation'],
};

function extractSheetId(urlOrId: string): string {
  if (!urlOrId.includes('/')) {
    return urlOrId;
  }
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}

// Case-insensitive column matching with fallbacks
function findColumnValue(row: Record<string, string>, fieldName: string, customMapping?: string): string | undefined {
  const headers = Object.keys(row);
  
  // First try custom mapping if provided
  if (customMapping) {
    const exactMatch = headers.find(h => h === customMapping);
    if (exactMatch && row[exactMatch]) return row[exactMatch];
    
    const caseInsensitive = headers.find(h => h.toLowerCase() === customMapping.toLowerCase());
    if (caseInsensitive && row[caseInsensitive]) return row[caseInsensitive];
  }
  
  // Try fallback column names
  const fallbacks = COLUMN_FALLBACKS[fieldName] || [];
  for (const fallback of fallbacks) {
    // Try exact match first
    const exactMatch = headers.find(h => h === fallback);
    if (exactMatch && row[exactMatch]) return row[exactMatch];
    
    // Try case-insensitive match
    const caseInsensitive = headers.find(h => h.toLowerCase() === fallback.toLowerCase());
    if (caseInsensitive && row[caseInsensitive]) return row[caseInsensitive];
    
    // Try partial match (header contains the fallback term)
    const partialMatch = headers.find(h => h.toLowerCase().includes(fallback.toLowerCase()));
    if (partialMatch && row[partialMatch]) return row[partialMatch];
  }
  
  return undefined;
}

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

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

  return { headers, rows };
}

// deno-lint-ignore no-explicit-any
async function getValidAccessToken(supabase: any): Promise<string | null> {
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
  
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return token.access_token;
  }

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

async function fetchSheetWithAPI(sheetId: string, accessToken: string, sheetName?: string): Promise<{ headers: string[]; rows: Record<string, string>[] } | null> {
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

    if (!values || values.length < 1) {
      return { headers: [], rows: [] };
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

    return { headers, rows };
  } catch (err) {
    console.error('Sheets API fetch error:', err);
    return null;
  }
}

async function fetchSheetWithCSV(sheetId: string): Promise<{ headers: string[]; rows: Record<string, string>[] | null; error?: string }> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  
  console.log('Fetching sheet via public CSV:', csvUrl);
  
  const response = await fetch(csvUrl);

  if (!response.ok) {
    console.error('CSV fetch error:', response.status, response.statusText);
    return { 
      headers: [],
      rows: null, 
      error: 'Failed to fetch Google Sheet. Make sure the sheet is publicly accessible (Anyone with the link can view), or connect your Google account in Settings.' 
    };
  }

  const csvText = await response.text();
  const { headers, rows } = parseCSV(csvText);
  return { headers, rows };
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

    let headers: string[] = [];
    let rows: Record<string, string>[] | null = null;
    let fetchError: string | undefined;
    
    const accessToken = await getValidAccessToken(supabase);
    
    if (accessToken) {
      console.log('Using OAuth API access...');
      const apiResult = await fetchSheetWithAPI(sheetId, accessToken, config.sheetName);
      
      if (apiResult) {
        headers = apiResult.headers;
        rows = apiResult.rows;
      } else {
        console.log('API fetch failed, falling back to public CSV...');
      }
    }
    
    if (rows === null) {
      console.log('Using public CSV access...');
      const csvResult = await fetchSheetWithCSV(sheetId);
      headers = csvResult.headers;
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

    // Log actual headers found for debugging
    console.log('Sheet headers found:', headers);
    console.log('Total rows fetched:', rows.length);

    if (rows.length === 0) {
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'success', last_sync_at: new Date().toISOString() })
        .eq('id', sourceId);
      
      return new Response(
        JSON.stringify({ 
          dealsCreated: 0, 
          dealsUpdated: 0, 
          dealsFailed: 0, 
          errors: [], 
          message: 'No data found in sheet',
          columnsFound: headers 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fieldMapping = config.fieldMapping || {};
    const mappedFields: string[] = [];
    const unmappedFields: string[] = [];

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowId = `row_${i + 2}`;

      try {
        // Get the startup name using flexible matching
        const name = findColumnValue(row, 'name', fieldMapping.name);
        
        if (!name || name.trim() === '') {
          console.log(`Skipping row ${i + 2}: no name found`);
          continue;
        }

        if (i === 0) mappedFields.push('name');

        const dealData: Record<string, unknown> = {
          name: name.trim(),
          source_type: 'gsheets',
          source_id: `${sheetId}_${rowId}`,
          stage: 'sourcing',
        };

        // Map all fields with flexible matching
        const sectorValue = findColumnValue(row, 'sector', fieldMapping.sector);
        if (sectorValue) {
          dealData.sector = sectorValue;
          if (i === 0) mappedFields.push('sector');
        }

        const descValue = findColumnValue(row, 'description', fieldMapping.description);
        if (descValue) {
          dealData.description = descValue;
          if (i === 0) mappedFields.push('description');
        }

        const websiteValue = findColumnValue(row, 'website_url', fieldMapping.website_url);
        if (websiteValue && (websiteValue.startsWith('http') || websiteValue.includes('.'))) {
          dealData.website_url = websiteValue.startsWith('http') ? websiteValue : `https://${websiteValue}`;
          if (i === 0) mappedFields.push('website_url');
        }

        const valuationValue = findColumnValue(row, 'valuation', fieldMapping.valuation);
        if (valuationValue) {
          const valuation = parseFloat(valuationValue.replace(/[^0-9.]/g, ''));
          if (!isNaN(valuation)) {
            dealData.valuation = valuation;
            if (i === 0) mappedFields.push('valuation');
          }
        }

        const askValue = findColumnValue(row, 'ask_amount', fieldMapping.ask_amount);
        if (askValue) {
          const askAmount = parseFloat(askValue.replace(/[^0-9.]/g, ''));
          if (!isNaN(askAmount)) {
            dealData.ask_amount = askAmount;
            if (i === 0) mappedFields.push('ask_amount');
          }
        }

        const pitchDeckValue = findColumnValue(row, 'pitch_deck_url', fieldMapping.pitch_deck_url);
        if (pitchDeckValue && pitchDeckValue.startsWith('http')) {
          dealData.pitch_deck_url = pitchDeckValue;
          if (i === 0) mappedFields.push('pitch_deck_url');
        }

        const founderEmailValue = findColumnValue(row, 'founder_email', fieldMapping.founder_email);
        if (founderEmailValue && founderEmailValue.includes('@')) {
          dealData.founder_email = founderEmailValue;
          if (i === 0) mappedFields.push('founder_email');
        }

        const founderNameValue = findColumnValue(row, 'founder_name', fieldMapping.founder_name);
        if (founderNameValue) {
          dealData.founder_name = founderNameValue;
          if (i === 0) mappedFields.push('founder_name');
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

    // Identify unmapped fields
    const allFields = ['name', 'sector', 'description', 'website_url', 'valuation', 'ask_amount', 'pitch_deck_url', 'founder_email', 'founder_name'];
    for (const field of allFields) {
      if (!mappedFields.includes(field)) {
        unmappedFields.push(field);
      }
    }

    // Update source sync status
    const syncStatus = (dealsCreated + dealsUpdated) > 0 ? 'success' : (dealsFailed > 0 ? 'error' : 'success');
    await supabase
      .from('deal_sources')
      .update({
        sync_status: syncStatus,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    console.log(`Sync complete: ${dealsCreated} created, ${dealsUpdated} updated, ${dealsFailed} failed`);
    console.log(`Mapped fields: ${mappedFields.join(', ')}`);
    console.log(`Unmapped fields: ${unmappedFields.join(', ')}`);

    return new Response(
      JSON.stringify({
        sourceId,
        syncedAt: new Date().toISOString(),
        dealsCreated,
        dealsUpdated,
        dealsFailed,
        errors,
        method: accessToken ? 'oauth_api' : 'public_csv',
        columnsFound: headers,
        mappedFields,
        unmappedFields,
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
