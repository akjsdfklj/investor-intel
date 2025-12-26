import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function validateString(value: unknown, fieldName: string, options: { required?: boolean; minLength?: number; maxLength?: number } = {}): { valid: boolean; sanitized?: string; error?: string } {
  const { required = false, minLength = 0, maxLength = 5000 } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: '' };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const sanitized = value.trim().slice(0, maxLength);

  if (sanitized.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  return { valid: true, sanitized };
}

function validateEmail(email: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const sanitized = email.trim().toLowerCase().slice(0, 255);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, sanitized };
}

function validateLinkedInUrl(url: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (!url || url === '') {
    return { valid: true, sanitized: undefined };
  }

  if (typeof url !== 'string') {
    return { valid: false, error: 'LinkedIn URL must be a string' };
  }

  const sanitized = url.trim().slice(0, 200);

  // Basic LinkedIn URL validation
  if (sanitized && !sanitized.toLowerCase().includes('linkedin.com')) {
    return { valid: false, error: 'Must be a valid LinkedIn URL' };
  }

  return { valid: true, sanitized };
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
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dealId, founderName, founderEmail, founderBio, linkedinUrl, additionalInfo } = body;

    // Validate all inputs
    const dealIdValidation = validateString(dealId, 'Deal ID', { required: true, maxLength: 100 });
    if (!dealIdValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: dealIdValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nameValidation = validateString(founderName, 'Founder name', { required: true, minLength: 1, maxLength: 100 });
    if (!nameValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: nameValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailValidation = validateEmail(founderEmail);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bioValidation = validateString(founderBio, 'Founder bio', { required: true, minLength: 10, maxLength: 5000 });
    if (!bioValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: bioValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const linkedinValidation = validateLinkedInUrl(linkedinUrl);
    if (!linkedinValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: linkedinValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const additionalInfoValidation = validateString(additionalInfo, 'Additional info', { required: false, maxLength: 5000 });
    if (!additionalInfoValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: additionalInfoValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Submitting founder inquiry for deal:', dealIdValidation.sanitized);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store founder inquiry with sanitized data
    const { data: inquiry, error: insertError } = await supabase
      .from('founder_inquiries')
      .insert({
        deal_id: dealIdValidation.sanitized,
        founder_name: nameValidation.sanitized,
        founder_email: emailValidation.sanitized,
        founder_bio: bioValidation.sanitized,
        linkedin_url: linkedinValidation.sanitized || null,
        additional_info: additionalInfoValidation.sanitized || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting inquiry:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to submit inquiry. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Inquiry submitted successfully:', inquiry.id);

    return new Response(
      JSON.stringify({ success: true, inquiry }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-founder-inquiry:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
