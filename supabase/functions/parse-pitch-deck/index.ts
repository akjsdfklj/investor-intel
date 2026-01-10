import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL validation
function validateUrl(url: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const sanitized = url.trim().slice(0, 2000);

  try {
    const parsed = new URL(sanitized);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    // Block internal networks
    const hostname = parsed.hostname.toLowerCase();
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blocked.includes(hostname) || hostname.startsWith('10.') || 
        hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
      return { valid: false, error: 'Invalid URL' };
    }

    return { valid: true, sanitized };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
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
      return new Response(JSON.stringify({ error: 'Invalid request body', content: '' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL - accept both 'url' and 'pdfUrl' parameters
    const urlValidation = validateUrl(body.url || body.pdfUrl);
    if (!urlValidation.valid) {
      return new Response(JSON.stringify({ error: urlValidation.error, content: '' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = urlValidation.sanitized!;
    console.log('Parsing pitch deck from:', url);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ content: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the PDF to check it exists
    const pdfResponse = await fetch(url);
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status);
      return new Response(JSON.stringify({ content: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to analyze the PDF
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
      console.error('AI gateway error:', response.status);
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
    return new Response(JSON.stringify({ content: '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
