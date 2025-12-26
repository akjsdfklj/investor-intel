import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    
    // Validate currentMetrics and assumptions objects
    let currentMetrics = {};
    let assumptions = null;
    
    if (body.currentMetrics && typeof body.currentMetrics === 'object') {
      currentMetrics = body.currentMetrics;
    }
    if (body.assumptions && typeof body.assumptions === 'object') {
      assumptions = body.assumptions;
    }

    if (!dealName) {
      return new Response(JSON.stringify({ error: 'Deal name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      console.error('AI API error:', response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Analysis service temporarily unavailable' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) cleanedContent = cleanedContent.slice(7);
    if (cleanedContent.startsWith('```')) cleanedContent = cleanedContent.slice(3);
    if (cleanedContent.endsWith('```')) cleanedContent = cleanedContent.slice(0, -3);
    
    let scenarioModel;
    try {
      scenarioModel = JSON.parse(cleanedContent.trim());
    } catch {
      console.error('Failed to parse scenario model');
      return new Response(JSON.stringify({ error: 'Failed to process analysis. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Scenario modeling completed');

    return new Response(JSON.stringify({ scenarioModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scenario-modeling:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
