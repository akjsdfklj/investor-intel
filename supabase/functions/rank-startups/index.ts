import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartupData {
  id: string;
  name: string;
  ddReport: {
    summary: string;
    scores: {
      team: { score: number; reason: string };
      market: { score: number; reason: string };
      product: { score: number; reason: string };
      moat: { score: number; reason: string };
    };
    pitchSanityCheck?: unknown;
    swotAnalysis?: unknown;
    moatAssessment?: unknown;
    financialAnalysis?: unknown;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startups } = await req.json() as { startups: StartupData[] };

    if (!startups || !Array.isArray(startups) || startups.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 startups required for comparison' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build summary for each startup
    const startupSummaries = startups.map(s => {
      const scores = s.ddReport.scores;
      const totalScore = (scores.team.score + scores.market.score + scores.product.score + scores.moat.score) * 5;
      
      return `
**${s.name}** (ID: ${s.id})
- Team Score: ${scores.team.score}/5 - ${scores.team.reason}
- Market Score: ${scores.market.score}/5 - ${scores.market.reason}
- Product Score: ${scores.product.score}/5 - ${scores.product.reason}
- Moat Score: ${scores.moat.score}/5 - ${scores.moat.reason}
- Total Score: ${totalScore}/100
- Summary: ${s.ddReport.summary?.slice(0, 500) || 'N/A'}
`;
    }).join('\n---\n');

    const systemPrompt = `You are an expert VC analyst comparing multiple startups to identify the best investment opportunities.
Your task is to rank all startups and provide detailed reasoning for the top 3 recommendations.

You must return ONLY valid JSON in this exact format:
{
  "top3": [
    {
      "rank": 1,
      "startupId": "startup_id_here",
      "name": "Startup Name",
      "overallScore": 85,
      "reasoning": "Detailed 2-3 sentence reasoning for why this is the top pick",
      "keyStrengths": ["strength1", "strength2", "strength3"],
      "keyRisks": ["risk1", "risk2"]
    }
  ],
  "allRankings": [
    {
      "rank": 1,
      "startupId": "startup_id",
      "name": "Startup Name",
      "score": 85,
      "breakdown": {
        "team": 4.5,
        "market": 4.0,
        "product": 4.5,
        "moat": 4.0,
        "financials": 3.5
      }
    }
  ],
  "comparisonInsights": "Key comparative insights about the startup pool",
  "investmentThesis": "Overall investment recommendation and thesis"
}`;

    const userPrompt = `Compare and rank these ${startups.length} startups. Identify the top 3 investment opportunities with detailed reasoning.

${startupSummaries}

Return a complete JSON ranking with all startups ranked. Be specific about why certain startups rank higher than others.`;

    console.log(`Ranking ${startups.length} startups...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    let ranking;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      ranking = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse ranking results');
    }

    // Validate and ensure all startups are in allRankings
    if (!ranking.allRankings || ranking.allRankings.length < startups.length) {
      // Fill in missing startups
      const rankedIds = new Set(ranking.allRankings?.map((r: { startupId: string }) => r.startupId) || []);
      const missingStartups = startups.filter(s => !rankedIds.has(s.id));
      
      const existingRankings = ranking.allRankings || [];
      const maxRank = existingRankings.length > 0 
        ? Math.max(...existingRankings.map((r: { rank: number }) => r.rank))
        : 0;

      missingStartups.forEach((s, idx) => {
        const scores = s.ddReport.scores;
        existingRankings.push({
          rank: maxRank + idx + 1,
          startupId: s.id,
          name: s.name,
          score: (scores.team.score + scores.market.score + scores.product.score + scores.moat.score) * 5,
          breakdown: {
            team: scores.team.score,
            market: scores.market.score,
            product: scores.product.score,
            moat: scores.moat.score,
            financials: 3
          }
        });
      });

      ranking.allRankings = existingRankings.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
      ranking.allRankings.forEach((r: { rank: number }, idx: number) => r.rank = idx + 1);
    }

    console.log('Ranking complete:', ranking.top3?.length, 'top picks identified');

    return new Response(JSON.stringify(ranking), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rank-startups:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Ranking failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
