import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTermSheetRequest {
  termSheetId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { termSheetId }: GenerateTermSheetRequest = await req.json();
    console.log('Generating term sheet for:', termSheetId);

    // Fetch term sheet with deal info
    const { data: termSheet, error: tsError } = await supabase
      .from('term_sheets')
      .select('*')
      .eq('id', termSheetId)
      .single();

    if (tsError || !termSheet) {
      console.error('Term sheet not found:', tsError);
      return new Response(
        JSON.stringify({ error: 'Term sheet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch deal info
    const { data: deal, error: dealError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', termSheet.deal_id)
      .single();

    if (dealError || !deal) {
      console.error('Deal not found:', dealError);
      return new Response(
        JSON.stringify({ error: 'Deal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML term sheet template
    const templateType = termSheet.template_type || 'safe';
    const companyName = deal.name;
    const investmentAmount = termSheet.investment_amount || 0;
    const valuationCap = termSheet.valuation_cap || 0;
    const discountRate = termSheet.discount_rate || 20;
    const proRataRights = termSheet.pro_rata_rights ? 'Yes' : 'No';

    let termSheetHtml = '';

    if (templateType === 'safe') {
      termSheetHtml = `
        <h1>SAFE (Simple Agreement for Future Equity)</h1>
        <h2>Term Sheet - ${companyName}</h2>
        
        <h3>Investment Amount</h3>
        <p>$${investmentAmount.toLocaleString()}</p>
        
        <h3>Valuation Cap</h3>
        <p>$${valuationCap.toLocaleString()}</p>
        
        <h3>Discount Rate</h3>
        <p>${discountRate}%</p>
        
        <h3>Pro-Rata Rights</h3>
        <p>${proRataRights}</p>
        
        <h3>Conversion</h3>
        <p>This SAFE will convert to equity upon the occurrence of an Equity Financing, Liquidity Event, or Dissolution Event.</p>
        
        <hr>
        <p><em>This is a non-binding term sheet for discussion purposes only.</em></p>
      `;
    } else if (templateType === 'convertible_note') {
      termSheetHtml = `
        <h1>Convertible Note</h1>
        <h2>Term Sheet - ${companyName}</h2>
        
        <h3>Principal Amount</h3>
        <p>$${investmentAmount.toLocaleString()}</p>
        
        <h3>Valuation Cap</h3>
        <p>$${valuationCap.toLocaleString()}</p>
        
        <h3>Conversion Discount</h3>
        <p>${discountRate}%</p>
        
        <h3>Interest Rate</h3>
        <p>5% per annum (simple interest)</p>
        
        <h3>Maturity Date</h3>
        <p>24 months from closing</p>
        
        <h3>Pro-Rata Rights</h3>
        <p>${proRataRights}</p>
        
        <hr>
        <p><em>This is a non-binding term sheet for discussion purposes only.</em></p>
      `;
    } else {
      termSheetHtml = `
        <h1>Equity Investment</h1>
        <h2>Term Sheet - ${companyName}</h2>
        
        <h3>Investment Amount</h3>
        <p>$${investmentAmount.toLocaleString()}</p>
        
        <h3>Pre-Money Valuation</h3>
        <p>$${valuationCap.toLocaleString()}</p>
        
        <h3>Ownership</h3>
        <p>${((investmentAmount / (valuationCap + investmentAmount)) * 100).toFixed(2)}%</p>
        
        <h3>Pro-Rata Rights</h3>
        <p>${proRataRights}</p>
        
        <hr>
        <p><em>This is a non-binding term sheet for discussion purposes only.</em></p>
      `;
    }

    console.log('Term sheet HTML generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        html: termSheetHtml,
        templateType,
        companyName,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating term sheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
