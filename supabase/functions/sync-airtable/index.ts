import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  sourceId: string;
}

interface AirtableConfig {
  baseId: string;
  tableName: string;
  viewName?: string;
  fieldMapping: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');

    if (!airtableApiKey) {
      return new Response(
        JSON.stringify({ error: 'Airtable API key not configured. Add AIRTABLE_API_KEY to secrets.' }),
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

    const config = source.config as AirtableConfig;
    const { baseId, tableName, viewName, fieldMapping } = config;

    // Fetch records from Airtable
    let airtableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    if (viewName) {
      airtableUrl += `?view=${encodeURIComponent(viewName)}`;
    }

    const airtableResponse = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'error' })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Airtable', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const airtableData = await airtableResponse.json();
    const records = airtableData.records || [];

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];

    // Process each record
    for (const record of records) {
      try {
        const fields = record.fields;
        
        // Map Airtable fields to pipeline_deals fields
        const dealData: Record<string, unknown> = {
          name: fields[fieldMapping.name] || 'Unknown',
          website_url: fields[fieldMapping.website_url] || null,
          description: fields[fieldMapping.description] || null,
          founder_name: fields[fieldMapping.founder_name] || null,
          founder_email: fields[fieldMapping.founder_email] || null,
          sector: fields[fieldMapping.sector] || null,
          ask_amount: parseFloat(fields[fieldMapping.ask_amount]) || null,
          valuation: parseFloat(fields[fieldMapping.valuation]) || null,
          source_type: 'airtable',
          source_id: record.id,
          stage: 'sourcing',
        };

        // Check if deal already exists
        const { data: existing } = await supabase
          .from('pipeline_deals')
          .select('id')
          .eq('source_id', record.id)
          .eq('source_type', 'airtable')
          .single();

        if (existing) {
          // Update existing deal
          const { error: updateError } = await supabase
            .from('pipeline_deals')
            .update(dealData)
            .eq('id', existing.id);

          if (updateError) throw updateError;
          dealsUpdated++;
        } else {
          // Create new deal
          const { error: insertError } = await supabase
            .from('pipeline_deals')
            .insert(dealData);

          if (insertError) throw insertError;
          dealsCreated++;
        }
      } catch (error: unknown) {
        dealsFailed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Record ${record.id}: ${message}`);
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
