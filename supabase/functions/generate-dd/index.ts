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
    const { dealName, dealUrl, dealDescription, scrapedContent, pitchDeckContent } = await req.json();

    console.log('Generating enhanced DD for:', dealName);
    console.log('Scraped content length:', scrapedContent?.length || 0);
    console.log('Pitch deck content length:', pitchDeckContent?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert venture capital analyst specializing in due diligence. You analyze startups and provide comprehensive investment analysis with peer comparisons, SWOT analysis, moat assessment, and investment success probability.

You must respond with valid JSON in this exact format:
{
  "summary": "A 2-3 paragraph executive summary of the investment opportunity",
  "team_score": <number 1-5>,
  "team_reason": "Detailed reasoning for team score",
  "market_score": <number 1-5>,
  "market_reason": "Detailed reasoning for market score", 
  "product_score": <number 1-5>,
  "product_reason": "Detailed reasoning for product score",
  "moat_score": <number 1-5>,
  "moat_reason": "Detailed reasoning for moat/defensibility score",
  "follow_up_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6"],
  
  "pitch_sanity_check": {
    "status": "green" | "amber" | "red",
    "problem": "The problem being solved",
    "solution": "The solution offered",
    "target_customer": "Who is the target customer",
    "pricing_model": "How they make money",
    "key_metrics": ["metric1", "metric2", "metric3"],
    "claimed_tam": "The claimed total addressable market",
    "missing_info": ["What's missing from the pitch"]
  },
  
  "swot_analysis": {
    "strengths": ["strength1", "strength2", "strength3", "strength4"],
    "weaknesses": ["weakness1", "weakness2", "weakness3", "weakness4"],
    "opportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
    "threats": ["threat1", "threat2", "threat3", "threat4"]
  },
  
  "moat_assessment": {
    "score": <number 0-10>,
    "type": "none" | "tech_ip" | "data_advantage" | "network_effects" | "brand" | "switching_costs" | "distribution" | "regulation",
    "reasoning": "Detailed explanation of the moat type and strength"
  },
  
  "competitor_mapping": [
    {
      "name": "Competitor name",
      "description": "What they do",
      "country": "Country",
      "funding_stage": "Seed/Series A/B/C etc",
      "website_url": "https://...",
      "comparison": "How the startup compares to this competitor"
    }
  ],
  
  "investment_success_rate": {
    "probability": <number 0-100>,
    "confidence": "low" | "medium" | "high",
    "reasoning": "Explanation of the probability calculation",
    "key_risks": ["risk1", "risk2", "risk3"],
    "key_strengths": ["strength1", "strength2", "strength3"]
  }
}

Scoring guide for 1-5 scores:
- 5: Exceptional, best-in-class
- 4: Strong, above average
- 3: Average, meets expectations  
- 2: Below average, concerns present
- 1: Weak, significant issues

Moat score guide (0-10):
- 8-10: Very strong moat, hard to replicate
- 5-7: Moderate moat, some defensibility
- 2-4: Weak moat, easily replicated
- 0-1: No moat

Investment success probability calculation should consider:
- Team quality and experience
- Market size and growth
- Product-market fit signals
- Competitive moat strength
- Comparable company success rates in the sector
- Current traction and metrics

Generate 5-8 realistic competitors based on the startup's sector and geography.`;

    const userPrompt = `Analyze this startup for investment potential with comprehensive due diligence:

Startup Name: ${dealName}
${dealUrl ? `Website: ${dealUrl}` : ''}
${dealDescription ? `Description: ${dealDescription}` : ''}

${scrapedContent ? `Website Content:
${scrapedContent.substring(0, 10000)}` : ''}

${pitchDeckContent ? `Pitch Deck Content:
${pitchDeckContent.substring(0, 10000)}` : ''}

${!scrapedContent && !pitchDeckContent ? 'No website or pitch deck content available - provide analysis based on name and description only, make reasonable assumptions about the business.' : ''}

Provide a thorough VC-style due diligence analysis including:
1. Executive summary
2. Investment scores with detailed reasoning
3. Pitch sanity check (RAG status)
4. Complete SWOT analysis
5. Detailed moat assessment
6. Competitor mapping (5-8 relevant competitors)
7. Investment success probability with key risks and strengths
8. Follow-up questions for the founders`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI response received, parsing JSON...');

    // Parse the JSON response
    let ddResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ddResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Enhanced DD generated successfully');

    return new Response(JSON.stringify(ddResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dd function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
