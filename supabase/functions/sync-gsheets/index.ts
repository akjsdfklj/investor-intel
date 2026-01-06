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
  sheetName: string;
  headerRow: number;
  fieldMapping: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google API key not configured. Add GOOGLE_API_KEY to secrets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { sourceId }: SyncRequest = await req.json();

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
    const { sheetId, sheetName, headerRow, fieldMapping } = config;

    // Fetch data from Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${googleApiKey}`;

    const sheetsResponse = await fetch(sheetsUrl);

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('Google Sheets API error:', errorText);
      
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'error' })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];

    if (rows.length <= headerRow) {
      return new Response(
        JSON.stringify({ error: 'No data rows found in sheet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get headers and create column index map
    const headers = rows[headerRow - 1] || [];
    const columnIndex: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      columnIndex[header] = index;
    });

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];

    // Process each data row (skip header)
    for (let i = headerRow; i < rows.length; i++) {
      const row = rows[i];
      const rowId = `row_${i + 1}`; // Use row number as ID

      try {
        const getValue = (field: string | undefined) => {
          if (!field) return null;
          const idx = columnIndex[field];
          return idx !== undefined ? row[idx] || null : null;
        };

        const name = getValue(fieldMapping.name);
        if (!name) continue; // Skip rows without a name

        const dealData: Record<string, unknown> = {
          name,
          website_url: getValue(fieldMapping.website_url),
          description: getValue(fieldMapping.description),
          founder_name: getValue(fieldMapping.founder_name),
          founder_email: getValue(fieldMapping.founder_email),
          sector: getValue(fieldMapping.sector),
          ask_amount: parseFloat(getValue(fieldMapping.ask_amount) || '') || null,
          valuation: parseFloat(getValue(fieldMapping.valuation) || '') || null,
          source_type: 'gforms', // Using gforms as it's more generic for Google sources
          source_id: `${sheetId}_${rowId}`,
          stage: 'sourcing',
        };

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
        errors.push(`Row ${i + 1}: ${message}`);
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
