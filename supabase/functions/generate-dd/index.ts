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
    const { dealName, dealUrl, dealDescription, scrapedContent } = await req.json();

    console.log('Generating DD for:', dealName);
    console.log('Scraped content length:', scrapedContent?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert venture capital analyst specializing in due diligence. You analyze startups and provide comprehensive investment analysis. 

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
  "follow_up_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6"]
}

Scoring guide:
- 5: Exceptional, best-in-class
- 4: Strong, above average
- 3: Average, meets expectations  
- 2: Below average, concerns present
- 1: Weak, significant issues`;

    const userPrompt = `Analyze this startup for investment potential:

Startup Name: ${dealName}
${dealUrl ? `Website: ${dealUrl}` : ''}
${dealDescription ? `Description: ${dealDescription}` : ''}

${scrapedContent ? `Website Content:
${scrapedContent.substring(0, 15000)}` : 'No website content available - provide analysis based on name and description only.'}

Provide a thorough VC-style due diligence analysis with scores and actionable follow-up questions.`;

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

    console.log('DD generated successfully');

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
