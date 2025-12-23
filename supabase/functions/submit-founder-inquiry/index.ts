import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, founderName, founderEmail, founderBio, linkedinUrl, additionalInfo } = await req.json();

    if (!dealId || !founderName || !founderEmail || !founderBio) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Submitting founder inquiry for deal:', dealId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Note: Deals are stored in localStorage with custom IDs, not in the database
    // So we skip the deal existence check and just store the inquiry

    // Store founder inquiry - using deal_id as text reference since deals are in localStorage
    const { data: inquiry, error: insertError } = await supabase
      .from('founder_inquiries')
      .insert({
        deal_id: dealId, // This will fail if FK constraint exists - need to remove it
        founder_name: founderName,
        founder_email: founderEmail,
        founder_bio: founderBio,
        linkedin_url: linkedinUrl || null,
        additional_info: additionalInfo || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting inquiry:', insertError);
      throw new Error('Failed to submit inquiry');
    }

    console.log('Inquiry submitted successfully:', inquiry.id);

    return new Response(
      JSON.stringify({ success: true, inquiry }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-founder-inquiry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
