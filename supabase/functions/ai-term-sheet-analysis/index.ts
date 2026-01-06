import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  dealId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dealId }: AnalysisRequest = await req.json();
    console.log('Analyzing deal for term sheet:', dealId);

    // Fetch deal info
    const { data: deal, error: dealError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('Deal not found:', dealError);
      return new Response(
        JSON.stringify({ error: 'Deal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch DD report if available
    let ddReport = null;
    if (deal.dd_report_id) {
      const { data } = await supabase
        .from('dd_reports')
        .select('*')
        .eq('id', deal.dd_report_id)
        .single();
      ddReport = data;
    }

    // Build context for AI analysis
    const context = {
      companyName: deal.name,
      sector: deal.sector || 'Unknown',
      description: deal.description || '',
      askAmount: deal.ask_amount || 0,
      valuation: deal.valuation || 0,
      stage: deal.stage,
      ddScores: ddReport ? {
        team: ddReport.team_score,
        market: ddReport.market_score,
        product: ddReport.product_score,
        moat: ddReport.moat_score,
      } : null,
    };

    // Call Lovable AI for analysis
    const aiEndpoint = 'https://api.lovable.dev/v1/chat/completions';
    const aiResponse = await fetch(aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a VC investment analyst. Analyze the deal and provide term sheet recommendations.
            
            Return a JSON object with:
            - suggestedTemplate: "safe" | "convertible_note" | "equity"
            - templateReason: string explaining why this template
            - valuationRange: { min: number, max: number } in dollars
            - suggestedDiscount: number (percentage, typically 15-25)
            - suggestedClauses: array of { clause: string, reason: string, priority: "required" | "recommended" | "optional" }
            - riskFactors: array of risk strings
            - comparableDeals: array of comparable deal descriptions
            
            Consider the sector, stage, valuation, and DD scores when making recommendations.`
          },
          {
            role: 'user',
            content: `Analyze this deal for term sheet generation:\n${JSON.stringify(context, null, 2)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      // Return sensible defaults if AI fails
      return new Response(
        JSON.stringify({
          suggestedTemplate: context.askAmount > 1000000 ? 'equity' : 'safe',
          templateReason: `Based on the ask amount of $${(context.askAmount / 1000000).toFixed(1)}M, ${context.askAmount > 1000000 ? 'equity investment' : 'SAFE'} is recommended for ${context.sector} startups.`,
          valuationRange: {
            min: context.valuation * 0.8 || 5000000,
            max: context.valuation * 1.2 || 15000000,
          },
          suggestedDiscount: 20,
          suggestedClauses: [
            { clause: 'Pro-rata rights', reason: 'Standard protection for follow-on investments', priority: 'recommended' },
            { clause: 'Information rights', reason: 'Quarterly financial reporting', priority: 'recommended' },
            { clause: 'Board observer seat', reason: 'Strategic oversight without control', priority: 'optional' },
          ],
          riskFactors: ['Early stage execution risk', 'Market timing uncertainty'],
          comparableDeals: [`Typical ${context.sector} seed deals range from $5M-$15M valuation`],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    console.log('AI analysis complete:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
