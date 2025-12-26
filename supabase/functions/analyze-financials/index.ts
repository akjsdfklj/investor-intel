import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateString(value: unknown, maxLength: number = 10000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate inputs
    const dealName = validateString(body.dealName, 200);
    const sector = validateString(body.sector, 100);
    const mode = validateString(body.mode, 20) || 'forecast';
    
    // Validate KPIs object if provided
    let kpis = {};
    if (body.kpis && typeof body.kpis === 'object') {
      kpis = body.kpis;
    }

    if (!dealName) {
      return new Response(JSON.stringify({ error: 'Deal name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Analyze financials request:', { dealName, sector, mode });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert VC financial analyst. Analyze startup financial KPIs and provide industry benchmarks and forecasts.

You must respond with valid JSON only, no markdown or additional text.`;

    const userPrompt = mode === 'forecast' 
      ? `Analyze and forecast for startup "${dealName}" in sector "${sector || 'Technology'}".

Current KPIs provided:
${JSON.stringify(kpis, null, 2)}

Generate a comprehensive financial analysis with:
1. Industry peer benchmarks for each KPI
2. 5-year forecasts (conservative estimates)
3. Key assumptions
4. AI insights on financial health

Respond with this exact JSON structure:
{
  "peerBenchmarks": [
    {
      "metric": "ARPU",
      "metricKey": "arpu",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "LTV",
      "metricKey": "ltv",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "CAC",
      "metricKey": "cac",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "LTV:CAC Ratio",
      "metricKey": "ltvCacRatio",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "Churn Rate",
      "metricKey": "churnRate",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "Gross Margin",
      "metricKey": "grossMargin",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "Revenue Growth Rate",
      "metricKey": "revenueGrowthRate",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    },
    {
      "metric": "EBITDA Margin",
      "metricKey": "ebitdaMargin",
      "startupValue": <current value or null>,
      "industryAvg": <industry average>,
      "topPerformers": <top 10% value>,
      "rating": "below" | "average" | "above" | "excellent"
    }
  ],
  "forecasts": [
    { "year": 2024, "revenue": <number>, "profit": <number>, "ebitda": <number>, "customers": <number>, "arpu": <number>, "ltv": <number>, "cac": <number> },
    { "year": 2025, "revenue": <number>, "profit": <number>, "ebitda": <number>, "customers": <number>, "arpu": <number>, "ltv": <number>, "cac": <number> },
    { "year": 2026, "revenue": <number>, "profit": <number>, "ebitda": <number>, "customers": <number>, "arpu": <number>, "ltv": <number>, "cac": <number> },
    { "year": 2027, "revenue": <number>, "profit": <number>, "ebitda": <number>, "customers": <number>, "arpu": <number>, "ltv": <number>, "cac": <number> },
    { "year": 2028, "revenue": <number>, "profit": <number>, "ebitda": <number>, "customers": <number>, "arpu": <number>, "ltv": <number>, "cac": <number> }
  ],
  "assumptions": [
    "Assumption 1 about market growth",
    "Assumption 2 about customer acquisition",
    "Assumption 3 about pricing",
    "Assumption 4 about costs"
  ],
  "aiInsights": "A 2-3 paragraph analysis of the startup's financial health, unit economics strength, and key recommendations for improvement."
}`
      : `Extract initial financial KPIs for startup "${dealName}" in sector "${sector || 'Technology'}".

Provide reasonable industry-standard estimates for a typical startup in this sector at early stage.

Respond with this exact JSON structure:
{
  "kpis": {
    "arpu": <number or null>,
    "arr": <number or null>,
    "mrr": <number or null>,
    "revenue": <number or null>,
    "revenueGrowthRate": <number or null>,
    "grossMargin": <number or null>,
    "profit": <number or null>,
    "ebitda": <number or null>,
    "ebitdaMargin": <number or null>,
    "netMargin": <number or null>,
    "totalCustomers": <number or null>,
    "cac": <number or null>,
    "ltv": <number or null>,
    "ltvCacRatio": <number or null>,
    "churnRate": <number or null>,
    "customerLifeCycle": <number or null>,
    "paybackPeriod": <number or null>,
    "avgOrderValue": <number or null>,
    "purchaseFrequency": <number or null>,
    "sales": <number or null>,
    "salesGrowthRate": <number or null>,
    "productLifeCycleStage": "introduction" | "growth" | "maturity" | "decline" | null
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Analysis service temporarily unavailable' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(JSON.stringify({ error: 'Failed to process analysis. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("AI response received, parsing...");

    // Clean and parse JSON
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch {
      console.error('Failed to parse financial analysis');
      return new Response(JSON.stringify({ error: 'Failed to process analysis. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log("Successfully parsed financial analysis");

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-financials:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
