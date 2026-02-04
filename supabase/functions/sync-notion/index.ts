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
  properties: Record<string, unknown>;
  url: string;
}

interface NotionDatabaseResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// Column name fallbacks for flexible matching
const PROPERTY_FALLBACKS: Record<string, string[]> = {
  name: ['Name', 'Company', 'Startup', 'Company Name', 'Startup Name', 'Title', 'Organization'],
  website_url: ['Website', 'Website URL', 'URL', 'Site', 'Web', 'Homepage'],
  description: ['Description', 'About', 'Summary', 'Overview', 'What they do', 'Product'],
  sector: ['Sector', 'Industry', 'Category', 'Vertical', 'Space', 'Market'],
  founder_name: ['Founder', 'Founder Name', 'Founders', 'CEO', 'Team Lead', 'Contact'],
  founder_email: ['Email', 'Founder Email', 'Contact Email', 'E-mail'],
  valuation: ['Valuation', 'Current Valuation', 'Pre-Money', 'Post-Money'],
  ask_amount: ['Ask', 'Ask Amount', 'Raise', 'Raising', 'Funding Ask', 'Investment'],
};

// Extract text from various Notion property types
function extractPropertyValue(property: unknown): string | number | null {
  if (!property || typeof property !== 'object') return null;
  
  const prop = property as Record<string, unknown>;
  const propType = prop.type as string;
  
  switch (propType) {
    case 'title': {
      const titleArray = prop.title as Array<{ plain_text: string }>;
      return titleArray?.map((t) => t.plain_text).join('') || null;
    }
    case 'rich_text': {
      const richTextArray = prop.rich_text as Array<{ plain_text: string }>;
      return richTextArray?.map((t) => t.plain_text).join('') || null;
    }
    case 'number':
      return prop.number as number | null;
    case 'url':
      return prop.url as string | null;
    case 'email':
      return prop.email as string | null;
    case 'phone_number':
      return prop.phone_number as string | null;
    case 'select': {
      const selectValue = prop.select as { name: string } | null;
      return selectValue?.name || null;
    }
    case 'multi_select': {
      const multiSelectArray = prop.multi_select as Array<{ name: string }>;
      return multiSelectArray?.map((s) => s.name).join(', ') || null;
    }
    case 'status': {
      const statusValue = prop.status as { name: string } | null;
      return statusValue?.name || null;
    }
    case 'people': {
      const peopleArray = prop.people as Array<{ name?: string; id: string }>;
      return peopleArray?.map((p) => p.name || p.id).join(', ') || null;
    }
    case 'formula': {
      const formula = prop.formula as { type: string; string?: string; number?: number };
      if (formula.type === 'string') return formula.string || null;
      if (formula.type === 'number') return formula.number ?? null;
      return null;
    }
    case 'rollup': {
      const rollup = prop.rollup as { type: string; number?: number; array?: unknown[] };
      if (rollup.type === 'number') return rollup.number ?? null;
      return null;
    }
    default:
      console.log(`Unknown property type: ${propType}`);
      return null;
  }
}

// Find property value with flexible matching
function findPropertyValue(
  properties: Record<string, unknown>,
  fieldName: string,
  customMapping?: string
): string | number | null {
  const propNames = Object.keys(properties);
  
  // First try custom mapping if provided
  if (customMapping) {
    const exactMatch = propNames.find(p => p === customMapping);
    if (exactMatch) {
      const value = extractPropertyValue(properties[exactMatch]);
      if (value !== null) return value;
    }
    
    const caseInsensitive = propNames.find(p => p.toLowerCase() === customMapping.toLowerCase());
    if (caseInsensitive) {
      const value = extractPropertyValue(properties[caseInsensitive]);
      if (value !== null) return value;
    }
  }
  
  // Try fallback property names
  const fallbacks = PROPERTY_FALLBACKS[fieldName] || [];
  for (const fallback of fallbacks) {
    const exactMatch = propNames.find(p => p === fallback);
    if (exactMatch) {
      const value = extractPropertyValue(properties[exactMatch]);
      if (value !== null) return value;
    }
    
    const caseInsensitive = propNames.find(p => p.toLowerCase() === fallback.toLowerCase());
    if (caseInsensitive) {
      const value = extractPropertyValue(properties[caseInsensitive]);
      if (value !== null) return value;
    }
  }
  
  return null;
}

// Extract database ID from URL or return as-is
function extractDatabaseId(urlOrId: string): string {
  // If it's already just an ID (32 hex chars with optional dashes)
  if (/^[a-f0-9-]{32,36}$/i.test(urlOrId.replace(/-/g, ''))) {
    return urlOrId.replace(/-/g, '');
  }
  
  // Try to extract from URL
  const match = urlOrId.match(/([a-f0-9]{32})/i);
  if (match) return match[1];
  
  // Try with dashes
  const dashMatch = urlOrId.match(/([a-f0-9-]{36})/i);
  if (dashMatch) return dashMatch[1].replace(/-/g, '');
  
  return urlOrId;
}

// Fetch all pages from Notion database
async function fetchNotionDatabase(databaseId: string, notionApiKey: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let hasMore = true;
  let nextCursor: string | null = null;
  
  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: 100,
    };
    if (nextCursor) {
      body.start_cursor = nextCursor;
    }
    
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', response.status, errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json() as NotionDatabaseResponse;
    pages.push(...data.results);
    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }
  
  return pages;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId } = await req.json();
    
    console.log(`Starting Notion sync for source: ${sourceId}`);
    
    if (!sourceId) {
      throw new Error("sourceId is required");
    }
    
    const notionApiKey = Deno.env.get("NOTION_API_KEY");
    if (!notionApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "NOTION_API_KEY is not configured. Please add your Notion integration token in Secrets.",
          needsSecret: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
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
    const databaseId = extractDatabaseId(config.databaseId || config.databaseUrl);
    
    console.log(`Fetching Notion database: ${databaseId}`);

    // Fetch pages from Notion
    const pages = await fetchNotionDatabase(databaseId, notionApiKey);
    console.log(`Fetched ${pages.length} pages from Notion`);

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let dealsFailed = 0;
    const errors: string[] = [];
    const mappedFields: string[] = [];

    // Process each page
    for (const page of pages) {
      try {
        const properties = page.properties as Record<string, unknown>;
        const fieldMapping = config.fieldMapping || {};
        
        // Get name (required)
        const name = findPropertyValue(properties, 'name', fieldMapping.name);
        
        if (!name || (typeof name === 'string' && name.trim() === '')) {
          console.log(`Skipping page ${page.id}: no name found`);
          dealsFailed++;
          continue;
        }

        if (dealsCreated + dealsUpdated === 0) mappedFields.push('name');

        const deal: Record<string, unknown> = {
          name: typeof name === 'string' ? name.trim() : String(name),
          source_type: 'notion',
          source_id: `notion:${page.id}`,
          stage: 'sourcing',
        };

        // Map optional fields
        const websiteValue = findPropertyValue(properties, 'website_url', fieldMapping.website_url);
        if (websiteValue && typeof websiteValue === 'string') {
          deal.website_url = websiteValue.startsWith('http') ? websiteValue : `https://${websiteValue}`;
          if (dealsCreated + dealsUpdated === 0) mappedFields.push('website_url');
        }

        const descValue = findPropertyValue(properties, 'description', fieldMapping.description);
        if (descValue) {
          deal.description = String(descValue);
          if (dealsCreated + dealsUpdated === 0) mappedFields.push('description');
        }

        const founderNameValue = findPropertyValue(properties, 'founder_name', fieldMapping.founder_name);
        if (founderNameValue) {
          deal.founder_name = String(founderNameValue);
          if (dealsCreated + dealsUpdated === 0) mappedFields.push('founder_name');
        }

        const founderEmailValue = findPropertyValue(properties, 'founder_email', fieldMapping.founder_email);
        if (founderEmailValue && typeof founderEmailValue === 'string' && founderEmailValue.includes('@')) {
          deal.founder_email = founderEmailValue;
          if (dealsCreated + dealsUpdated === 0) mappedFields.push('founder_email');
        }

        const sectorValue = findPropertyValue(properties, 'sector', fieldMapping.sector);
        if (sectorValue) {
          deal.sector = String(sectorValue);
          if (dealsCreated + dealsUpdated === 0) mappedFields.push('sector');
        }

        const askValue = findPropertyValue(properties, 'ask_amount', fieldMapping.ask_amount);
        if (askValue !== null) {
          const amount = typeof askValue === 'number' ? askValue : parseFloat(String(askValue).replace(/[^0-9.]/g, ''));
          if (!isNaN(amount)) {
            deal.ask_amount = amount;
            if (dealsCreated + dealsUpdated === 0) mappedFields.push('ask_amount');
          }
        }

        const valuationValue = findPropertyValue(properties, 'valuation', fieldMapping.valuation);
        if (valuationValue !== null) {
          const val = typeof valuationValue === 'number' ? valuationValue : parseFloat(String(valuationValue).replace(/[^0-9.]/g, ''));
          if (!isNaN(val)) {
            deal.valuation = val;
            if (dealsCreated + dealsUpdated === 0) mappedFields.push('valuation');
          }
        }

        // Check if deal already exists
        const notionSourceId = `notion:${page.id}`;
        const { data: existingDeal } = await supabase
          .from("pipeline_deals")
          .select("id")
          .eq("source_id", notionSourceId)
          .maybeSingle();

        if (existingDeal) {
          const { error: updateError } = await supabase
            .from("pipeline_deals")
            .update({
              ...deal,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingDeal.id);

          if (updateError) {
            console.error(`Failed to update deal ${existingDeal.id}:`, updateError);
            dealsFailed++;
            errors.push(`Update failed for ${deal.name}: ${updateError.message}`);
          } else {
            dealsUpdated++;
            console.log(`Updated deal: ${deal.name}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from("pipeline_deals")
            .insert(deal);

          if (insertError) {
            console.error(`Failed to create deal:`, insertError);
            dealsFailed++;
            errors.push(`Insert failed for ${deal.name}: ${insertError.message}`);
          } else {
            dealsCreated++;
            console.log(`Created deal: ${deal.name}`);
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
    const syncStatus = (dealsCreated + dealsUpdated) > 0 ? 'success' : (dealsFailed > 0 && pages.length > 0 ? 'error' : 'success');
    await supabase
      .from("deal_sources")
      .update({
        sync_status: syncStatus,
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
      totalPages: pages.length,
      mappedFields,
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
