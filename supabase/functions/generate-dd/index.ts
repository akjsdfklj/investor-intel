import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateString(value: unknown, maxLength: number = 50000): string {
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

    // Validate and sanitize inputs
    const dealName = validateString(body.dealName, 200);
    const dealUrl = validateString(body.dealUrl, 2000);
    const dealDescription = validateString(body.dealDescription, 5000);
    const scrapedContent = validateString(body.scrapedContent, 50000);
    const pitchDeckContent = validateString(body.pitchDeckContent, 50000);

    if (!dealName) {
      return new Response(JSON.stringify({ error: 'Deal name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating enhanced DD for:', dealName);
    console.log('Scraped content length:', scrapedContent.length);
    console.log('Pitch deck content length:', pitchDeckContent.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const ddSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        team_score: { type: "number" },
        team_reason: { type: "string" },
        market_score: { type: "number" },
        market_reason: { type: "string" },
        product_score: { type: "number" },
        product_reason: { type: "string" },
        moat_score: { type: "number" },
        moat_reason: { type: "string" },
        follow_up_questions: { type: "array", items: { type: "string" } },
        pitch_sanity_check: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["green", "amber", "red"] },
            problem: { type: "string" },
            solution: { type: "string" },
            target_customer: { type: "string" },
            pricing_model: { type: "string" },
            key_metrics: { type: "array", items: { type: "string" } },
            claimed_tam: { type: "string" },
            missing_info: { type: "array", items: { type: "string" } }
          },
          required: ["status", "problem", "solution", "target_customer", "pricing_model", "key_metrics", "claimed_tam", "missing_info"]
        },
        swot_analysis: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } }
          },
          required: ["strengths", "weaknesses", "opportunities", "threats"]
        },
        moat_assessment: {
          type: "object",
          properties: {
            score: { type: "number" },
            type: { type: "string" },
            reasoning: { type: "string" }
          },
          required: ["score", "type", "reasoning"]
        },
        competitor_mapping: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              country: { type: "string" },
              funding_stage: { type: "string" },
              website_url: { type: "string" },
              comparison: { type: "string" }
            },
            required: ["name", "description", "country", "funding_stage", "comparison"]
          }
        },
        investment_success_rate: {
          type: "object",
          properties: {
            probability: { type: "number" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            reasoning: { type: "string" },
            key_risks: { type: "array", items: { type: "string" } },
            key_strengths: { type: "array", items: { type: "string" } }
          },
          required: ["probability", "confidence", "reasoning", "key_risks", "key_strengths"]
        }
      },
      required: ["summary", "team_score", "team_reason", "market_score", "market_reason", "product_score", "product_reason", "moat_score", "moat_reason", "follow_up_questions", "pitch_sanity_check", "swot_analysis", "moat_assessment", "competitor_mapping", "investment_success_rate"]
    };

    // Retry logic for transient failures
    let response: Response | null = null;
    let lastError = '';
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            tools: [{
              type: "function",
              function: {
                name: "generate_dd_report",
                description: "Generate a comprehensive due diligence report for a startup",
                parameters: ddSchema
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_dd_report" } }
          }),
        });

        if (response.ok) break;
        
        // Don't retry on client errors (4xx), only server errors (5xx)
        if (response.status < 500) break;
        
        lastError = `AI gateway error: ${response.status}`;
        console.log(`Attempt ${attempt} failed with ${response.status}, retrying...`);
        
        // Wait before retrying (exponential backoff)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
        console.log(`Attempt ${attempt} failed: ${lastError}, retrying...`);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (!response || !response.ok) {
      console.error('AI gateway error after retries:', lastError);
      
      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response?.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Analysis service temporarily unavailable. Please try again in a moment.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI response received, parsing tool call...');

    // Extract from tool call response
    let ddResult;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        ddResult = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse from content
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          // Remove markdown code blocks if present
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            ddResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } else {
          throw new Error('No content in response');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to process analysis. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Enhanced DD generated successfully');

    return new Response(JSON.stringify(ddResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dd function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
