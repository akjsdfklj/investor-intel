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
    const { dealName, sector, geography, description, claimedTAM, scrapedContent } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing TAM for:', dealName);

    const prompt = `You are an expert market analyst. Analyze the Total Addressable Market (TAM) for this startup.

STARTUP: ${dealName}
SECTOR: ${sector || 'Not specified'}
GEOGRAPHY: ${geography || 'Global'}
DESCRIPTION: ${description || 'Not provided'}
CLAIMED TAM: ${claimedTAM || 'Not specified'}
ADDITIONAL CONTEXT: ${scrapedContent?.substring(0, 3000) || 'None'}

Provide a comprehensive TAM analysis using BOTH top-down and bottom-up approaches.

You MUST respond with valid JSON only (no markdown, no code blocks):
{
  "topDown": {
    "globalMarket": <number in USD>,
    "cagr": <percentage as number>,
    "tam": <number in USD>,
    "sam": <number in USD>,
    "som": <number in USD>,
    "methodology": "<explanation of calculation>",
    "sources": ["<source 1>", "<source 2>"]
  },
  "bottomUp": {
    "targetCustomers": <number>,
    "avgRevenuePerCustomer": <number in USD>,
    "calculatedTAM": <number in USD>,
    "penetrationRate": <realistic % they can capture>,
    "methodology": "<explanation>"
  },
  "validation": {
    "status": "<validated|questionable|inflated>",
    "claimedVsCalculated": "<comparison analysis>",
    "reasoning": "<detailed reasoning>",
    "redFlags": ["<flag 1>", "<flag 2>"]
  }
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a market analysis expert. Always respond with valid JSON only.' },
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
    
    const tamAnalysis = JSON.parse(cleanedContent.trim());
    
    console.log('TAM analysis completed successfully');

    return new Response(JSON.stringify({ tamAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-tam:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
