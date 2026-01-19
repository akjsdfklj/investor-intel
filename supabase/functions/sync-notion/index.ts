import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotionConfig {
  databaseId: string;
  databaseUrl: string;
  fieldMapping: {
    name?: string;
    website_url?: string;
    description?: string;
    founder_name?: string;
    founder_email?: string;
    sector?: string;
    ask_amount?: string;
    valuation?: string;
  };
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  url: string;
}

interface NotionDatabaseResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// Extract text from various Notion property types
function extractPropertyValue(property: any): string | number | null {
  if (!property) return null;
  
  switch (property.type) {
    case 'title':
      return property.title?.map((t: any) => t.plain_text).join('') || null;
    case 'rich_text':
      return property.rich_text?.map((t: any) => t.plain_text).join('') || null;
    case 'number':
      return property.number;
    case 'url':
      return property.url;
    case 'email':
      return property.email;
    case 'phone_number':
      return property.phone_number;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name).join(', ') || null;
    case 'status':
      return property.status?.name || null;
    case 'people':
      return property.people?.map((p: any) => p.name || p.id).join(', ') || null;
    case 'formula':
      if (property.formula.type === 'string') return property.formula.string;
      if (property.formula.type === 'number') return property.formula.number;
      return null;
    case 'rollup':
      if (property.rollup.type === 'number') return property.rollup.number;
      if (property.rollup.type === 'array') {
        return property.rollup.array?.map((item: any) => extractPropertyValue(item)).join(', ') || null;
      }
      return null;
    default:
      console.log(`Unknown property type: ${property.type}`);
      return null;
  }
}

// Map Notion page to pipeline deal fields
function mapNotionPageToDeal(
  page: NotionPage, 
  config: NotionConfig,
  sourceId: string
): Record<string, any> | null {
  const { properties } = page;
  const { fieldMapping } = config;
  
  // Find the name (required)
  let name: string | null = null;
  if (fieldMapping.name && properties[fieldMapping.name]) {
    name = extractPropertyValue(properties[fieldMapping.name]) as string;
  }
  
  // Fallback: look for common name fields
  if (!name) {
    const nameKeys = ['Name', 'Company', 'Startup', 'Company Name', 'Startup Name', 'Title'];
    for (const key of nameKeys) {
      if (properties[key]) {
        const value = extractPropertyValue(properties[key]);
        if (value && typeof value === 'string') {
          name = value;
          break;
        }
      }
    }
  }
  
  if (!name) {
    console.log(`Skipping page ${page.id}: no name found`);
    return null;
  }
  
  const deal: Record<string, any> = {
    name,
    source_type: 'notion',
    source_id: `notion:${page.id}`,
    stage: 'sourcing',
  };
  
  // Map optional fields
  if (fieldMapping.website_url && properties[fieldMapping.website_url]) {
    deal.website_url = extractPropertyValue(properties[fieldMapping.website_url]);
  }
  if (fieldMapping.description && properties[fieldMapping.description]) {
    deal.description = extractPropertyValue(properties[fieldMapping.description]);
  }
  if (fieldMapping.founder_name && properties[fieldMapping.founder_name]) {
    deal.founder_name = extractPropertyValue(properties[fieldMapping.founder_name]);
  }
  if (fieldMapping.founder_email && properties[fieldMapping.founder_email]) {
    deal.founder_email = extractPropertyValue(properties[fieldMapping.founder_email]);
  }
  if (fieldMapping.sector && properties[fieldMapping.sector]) {
    deal.sector = extractPropertyValue(properties[fieldMapping.sector]);
  }
  if (fieldMapping.ask_amount && properties[fieldMapping.ask_amount]) {
    const amount = extractPropertyValue(properties[fieldMapping.ask_amount]);
    if (typeof amount === 'number') {
      deal.ask_amount = amount;
    } else if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) deal.ask_amount = parsed;
    }
  }
  if (fieldMapping.valuation && properties[fieldMapping.valuation]) {
    const val = extractPropertyValue(properties[fieldMapping.valuation]);
    if (typeof val === 'number') {
      deal.valuation = val;
    } else if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) deal.valuation = parsed;
    }
  }
  
  return deal;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, notionData } = await req.json();
    
    console.log(`Starting Notion sync for source: ${sourceId}`);
    
    if (!sourceId) {
      throw new Error("sourceId is required");
    }
    
    if (!notionData || !Array.isArray(notionData.pages)) {
      throw new Error("notionData with pages array is required");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get source configuration
    const { data: source, error: sourceError } = await supabase
      .from("deal_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(`Source not found: ${sourceError?.message || "Unknown error"}`);
    }

    if (source.source_type !== "notion") {
      throw new Error(`Invalid source type: ${source.source_type}`);
    }

    const config = source.config as NotionConfig;
    console.log(`Processing ${notionData.pages.length} pages from Notion`);

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];

    // Process each page
    for (const page of notionData.pages) {
      try {
        const dealData = mapNotionPageToDeal(page, config, sourceId);
        
        if (!dealData) {
          dealsFailed++;
          continue;
        }

        // Check if deal already exists
        const notionSourceId = `notion:${page.id}`;
        const { data: existingDeal } = await supabase
          .from("pipeline_deals")
          .select("id")
          .eq("source_id", notionSourceId)
          .maybeSingle();

        if (existingDeal) {
          // Update existing deal
          const { error: updateError } = await supabase
            .from("pipeline_deals")
            .update({
              ...dealData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingDeal.id);

          if (updateError) {
            console.error(`Failed to update deal ${existingDeal.id}:`, updateError);
            dealsFailed++;
            errors.push(`Update failed for ${dealData.name}: ${updateError.message}`);
          } else {
            dealsUpdated++;
            console.log(`Updated deal: ${dealData.name}`);
          }
        } else {
          // Create new deal
          const { error: insertError } = await supabase
            .from("pipeline_deals")
            .insert(dealData);

          if (insertError) {
            console.error(`Failed to create deal:`, insertError);
            dealsFailed++;
            errors.push(`Insert failed for ${dealData.name}: ${insertError.message}`);
          } else {
            dealsCreated++;
            console.log(`Created deal: ${dealData.name}`);
          }
        }
      } catch (pageError: unknown) {
        const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown error';
        console.error(`Error processing page ${page.id}:`, pageError);
        dealsFailed++;
        errors.push(`Page ${page.id}: ${errorMessage}`);
      }
    }

    // Update source sync status
    await supabase
      .from("deal_sources")
      .update({
        sync_status: errors.length === 0 ? "success" : "error",
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    const result = {
      sourceId,
      syncedAt: new Date().toISOString(),
      dealsCreated,
      dealsUpdated,
      dealsFailed,
      errors,
    };

    console.log(`Sync complete:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sync from Notion";
    console.error("Notion sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
