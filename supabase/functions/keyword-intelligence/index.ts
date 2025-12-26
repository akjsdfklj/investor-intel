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
    const websiteUrl = validateString(body.websiteUrl, 2000);
    const description = validateString(body.description, 5000);
    
    // Validate competitors array if provided
    let competitors = null;
    if (body.competitors && Array.isArray(body.competitors)) {
      competitors = body.competitors.slice(0, 20);
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

    console.log('Analyzing keywords for:', dealName);

    const prompt = `You are an SEO and keyword intelligence expert. Analyze the keyword landscape for this startup.

STARTUP: ${dealName}
SECTOR: ${sector || 'Technology'}
WEBSITE: ${websiteUrl || 'Not provided'}
DESCRIPTION: ${description || 'Not provided'}
COMPETITORS: ${competitors ? JSON.stringify(competitors.map((c: any) => c.name)) : 'Not identified'}

Provide comprehensive keyword intelligence analysis.

You MUST respond with valid JSON only (no markdown):
{
  "primaryKeywords": [
    {
      "keyword": "<keyword phrase>",
      "searchVolume": <monthly searches estimate>,
      "difficulty": <1-100 score>,
      "trend": "<rising|stable|declining>",
      "cpc": <cost per click in USD>
    }
  ],
  "competitorKeywords": [
    {
      "keyword": "<keyword>",
      "competitors": ["<competitor 1>", "<competitor 2>"],
      "overlap": <percentage of competitors targeting this>
    }
  ],
  "opportunityGaps": [
    {
      "keyword": "<untapped keyword>",
      "potential": "<high|medium|low>",
      "reasoning": "<why this is an opportunity>"
    }
  ],
  "seoScore": <0-100 estimated score>,
  "recommendations": [
    "<actionable recommendation 1>",
    "<recommendation 2>"
  ]
}

Include 10-15 primary keywords, 5-8 competitor keywords, and 5-7 opportunity gaps.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Always respond with valid JSON only.' },
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
    
    let keywordIntelligence;
    try {
      keywordIntelligence = JSON.parse(cleanedContent.trim());
    } catch {
      console.error('Failed to parse keyword analysis');
      return new Response(JSON.stringify({ error: 'Failed to process analysis. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Keyword analysis completed');

    return new Response(JSON.stringify({ keywordIntelligence }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in keyword-intelligence:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
