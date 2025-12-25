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
    const { dealName, sector, geography, description, existingCompetitors } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing competitors for:', dealName);

    const prompt = `You are an expert competitive intelligence analyst. Provide detailed analysis of competitors for this startup.

STARTUP: ${dealName}
SECTOR: ${sector || 'Technology'}
GEOGRAPHY: ${geography || 'Global'}
DESCRIPTION: ${description || 'Not provided'}
KNOWN COMPETITORS: ${existingCompetitors ? JSON.stringify(existingCompetitors) : 'None identified yet'}

Identify 5-8 key competitors and provide comprehensive details including funding history and investors.

You MUST respond with valid JSON only (no markdown):
{
  "competitors": [
    {
      "name": "<company name>",
      "description": "<what they do>",
      "country": "<HQ country>",
      "headquarters": "<city, country>",
      "founded": <year>,
      "employeeCount": <estimated number>,
      "websiteUrl": "<url>",
      "funding": {
        "totalRaised": <USD amount>,
        "lastRound": "<Series A/B/C etc>",
        "lastRoundAmount": <USD amount>,
        "lastRoundDate": "<YYYY-MM>",
        "valuation": <USD or null if unknown>
      },
      "investors": [
        {
          "name": "<investor name>",
          "type": "<VC|Angel|PE|Corporate|Accelerator>",
          "leadInvestor": <true|false>
        }
      ],
      "kpis": {
        "estimatedRevenue": <USD or null>,
        "estimatedCustomers": <number or null>,
        "estimatedArpu": <USD or null>,
        "growthRate": <percentage or null>
      },
      "comparison": {
        "strengthsVsStartup": ["<strength 1>", "<strength 2>"],
        "weaknessesVsStartup": ["<weakness 1>", "<weakness 2>"],
        "marketPosition": "<leader|challenger|niche|emerging>",
        "threatLevel": "<high|medium|low>"
      }
    }
  ]
}

Include a mix of direct competitors, adjacent players, and potential future competitors. Be realistic with estimates.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a competitive intelligence expert. Always respond with valid JSON only.' },
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
    
    const result = JSON.parse(cleanedContent.trim());
    
    console.log('Competitor analysis completed, found:', result.competitors?.length || 0);

    return new Response(JSON.stringify({ detailedCompetitors: result.competitors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-competitors:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
