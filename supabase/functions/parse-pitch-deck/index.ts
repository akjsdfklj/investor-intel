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
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing pitch deck from:', url);

    // For now, we'll use the AI to describe the PDF content
    // In production, you'd use a proper PDF parser
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch the PDF to check it exists
    const pdfResponse = await fetch(url);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }

    // Since we can't directly parse PDF in edge functions, we'll use AI to analyze it
    // The AI model can process the PDF URL directly
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a pitch deck analyzer. Extract and summarize the key content from startup pitch decks.
            
Extract:
- Company name and tagline
- Problem being solved
- Solution offered
- Target market/customer
- Business model
- Key metrics/traction
- Team information
- Funding ask (if mentioned)
- Any financial projections

Provide a comprehensive text summary of all content.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this pitch deck and extract all relevant information:',
              },
              {
                type: 'image_url',
                image_url: { url },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return empty content on error - the DD will still work with other data
      return new Response(JSON.stringify({ content: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('Pitch deck parsed, content length:', content.length);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-pitch-deck function:', error);
    // Return empty content on error
    return new Response(JSON.stringify({ content: '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
