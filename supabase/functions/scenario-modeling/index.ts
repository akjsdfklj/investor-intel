import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealName, sector, currentMetrics, assumptions } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Creating scenario models for:', dealName);

    const prompt = `You are an expert financial modeler. Create three scenario projections (Bear, Base, Bull) for this startup.

STARTUP: ${dealName}
SECTOR: ${sector || 'Technology'}
CURRENT METRICS:
${JSON.stringify(currentMetrics, null, 2)}

USER ASSUMPTIONS:
${assumptions ? JSON.stringify(assumptions, null, 2) : 'Use industry-standard assumptions'}

Create detailed 5-year projections for each scenario. Calculate IRR assuming an entry at current stage.

You MUST respond with valid JSON only (no markdown):
{
  "baseCase": {
    "year1": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year3": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year5": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "exitValuation": <num>,
    "multipleUsed": "<e.g., 8x ARR>",
    "irr": <percentage>
  },
  "bullCase": {
    "year1": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year3": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year5": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "exitValuation": <num>,
    "multipleUsed": "<e.g., 12x ARR>",
    "irr": <percentage>
  },
  "bearCase": {
    "year1": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year3": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "year5": { "revenue": <num>, "customers": <num>, "arpu": <num>, "growthRate": <pct>, "burnRate": <num>, "runway": <months> },
    "exitValuation": <num>,
    "multipleUsed": "<e.g., 4x ARR>",
    "irr": <percentage>
  },
  "assumptions": {
    "marketGrowth": { "base": <pct>, "bull": <pct>, "bear": <pct> },
    "customerGrowth": { "base": <pct>, "bull": <pct>, "bear": <pct> },
    "churnRate": { "base": <pct>, "bull": <pct>, "bear": <pct> },
    "pricingPower": { "base": <pct>, "bull": <pct>, "bear": <pct> },
    "fundingEnvironment": "<description>"
  },
  "probabilityWeighted": {
    "expectedRevenue": <num - weighted avg of Y5 revenues>,
    "expectedValuation": <num - weighted avg of exit valuations>,
    "irr": <weighted avg IRR>
  }
}

Use probabilities: Bear 20%, Base 50%, Bull 30% for weighted calculations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a financial modeling expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) cleanedContent = cleanedContent.slice(7);
    if (cleanedContent.startsWith('```')) cleanedContent = cleanedContent.slice(3);
    if (cleanedContent.endsWith('```')) cleanedContent = cleanedContent.slice(0, -3);
    
    const scenarioModel = JSON.parse(cleanedContent.trim());
    
    console.log('Scenario modeling completed');

    return new Response(JSON.stringify({ scenarioModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in scenario-modeling:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
