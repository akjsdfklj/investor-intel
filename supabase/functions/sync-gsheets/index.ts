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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    
    console.log('Fetching Google Sheet:', sheetId);

    // Fetch sheet data as CSV (works for public sheets without API key)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    
    const sheetsResponse = await fetch(csvUrl);

    if (!sheetsResponse.ok) {
      console.error('Google Sheets fetch error:', sheetsResponse.status, sheetsResponse.statusText);
      
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'error' })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Google Sheet. Make sure the sheet is publicly accessible (Anyone with the link can view).' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const csvText = await sheetsResponse.text();
    console.log('CSV data received, length:', csvText.length);
    
    const rows = parseCSV(csvText);
    console.log('Parsed rows:', rows.length);

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
      const rowId = `row_${i + 2}`; // +2 because CSV is 0-indexed and we skip header

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
