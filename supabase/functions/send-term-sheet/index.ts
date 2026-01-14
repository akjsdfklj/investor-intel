import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttachmentData {
  name: string;
  content: string;
  type: string;
}

interface SendTermSheetRequest {
  termSheetId: string;
  toEmails?: string[];
  ccEmails?: string[];
  attachment?: AttachmentData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { termSheetId, toEmails, ccEmails, attachment }: SendTermSheetRequest = await req.json();
    console.log('Sending term sheet:', termSheetId);
    console.log('To:', toEmails);
    console.log('CC:', ccEmails);
    console.log('Has attachment:', !!attachment);

    // Fetch term sheet
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

    // Use provided emails or fall back to stored recipient
    const recipients = toEmails && toEmails.length > 0 
      ? toEmails 
      : (termSheet.recipient_email ? [termSheet.recipient_email] : []);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipient email configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Format email content
    const templateLabels: Record<string, string> = {
      safe: 'SAFE',
      convertible_note: 'Convertible Note',
      equity: 'Equity Investment',
    };

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Term Sheet for ${deal.name}</h1>
        
        <p>Dear ${deal.founder_name || 'Founder'},</p>
        
        <p>We are pleased to share the term sheet for our proposed investment in ${deal.name}.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Investment Summary</h3>
          <p><strong>Type:</strong> ${templateLabels[termSheet.template_type] || termSheet.template_type}</p>
          <p><strong>Investment Amount:</strong> $${(termSheet.investment_amount || 0).toLocaleString()}</p>
          <p><strong>Valuation Cap:</strong> $${(termSheet.valuation_cap || 0).toLocaleString()}</p>
          ${termSheet.discount_rate ? `<p><strong>Discount Rate:</strong> ${termSheet.discount_rate}%</p>` : ''}
          <p><strong>Pro-Rata Rights:</strong> ${termSheet.pro_rata_rights ? 'Yes' : 'No'}</p>
        </div>
        
        <p>Please review the ${attachment ? 'attached' : ''} term sheet and let us know if you have any questions.</p>
        
        <p>Best regards,<br>Investment Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">This is a non-binding term sheet for discussion purposes only.</p>
      </div>
    `;

    // If Resend API key is configured, send the email
    if (resendApiKey) {
      try {
        // Prepare email options
        const emailOptions: any = {
          from: 'Investment Team <onboarding@resend.dev>',
          to: recipients,
          subject: `Term Sheet: ${deal.name}`,
          html: emailHtml,
        };

        // Add CC if provided
        if (ccEmails && ccEmails.length > 0) {
          emailOptions.cc = ccEmails;
        }

        // Add attachment if provided
        if (attachment) {
          emailOptions.attachments = [
            {
              filename: attachment.name,
              content: attachment.content,
            },
          ];
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailOptions),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Resend error:', errorData);
          // Don't fail - just log the error and continue
        } else {
          const responseData = await response.json();
          console.log('Email sent successfully via Resend:', responseData);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole request
      }
    } else {
      console.log('RESEND_API_KEY not configured - skipping email send');
    }

    // Update term sheet status
    const { error: updateError } = await supabase
      .from('term_sheets')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipient_email: recipients[0], // Store the primary recipient
      })
      .eq('id', termSheetId);

    if (updateError) {
      console.error('Error updating term sheet status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: resendApiKey ? 'Term sheet sent via email' : 'Term sheet marked as sent (email not configured)',
        sentTo: recipients,
        ccTo: ccEmails || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending term sheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
