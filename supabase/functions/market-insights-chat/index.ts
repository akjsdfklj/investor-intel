import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateString(value: unknown, maxLength: number = 10000): string {
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

    // Validate inputs
    const question = validateString(body.question, 2000);
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate dealContext object
    let dealContext = {};
    if (body.dealContext && typeof body.dealContext === 'object') {
      dealContext = body.dealContext;
    }

    // Validate chatHistory array - limit to last 10 messages
    let chatHistory: any[] = [];
    if (body.chatHistory && Array.isArray(body.chatHistory)) {
      chatHistory = body.chatHistory.slice(-10).map((msg: any) => ({
        role: typeof msg.role === 'string' ? msg.role : 'user',
        content: validateString(msg.content, 5000)
      }));
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing market insight question:', question);

    const systemPrompt = `You are a VC market analyst assistant. You have deep knowledge of:
- Market trends and dynamics
- Competitive landscapes
- Regulatory environments
- Technology trends
- Investment patterns

You are analyzing a specific startup/deal with this context:
${JSON.stringify(dealContext, null, 2)}

Provide insightful, data-driven answers. When you don't have specific data, make reasonable estimates based on industry knowledge and clearly state your confidence level.

Format your response as JSON:
{
  "answer": "<your detailed answer>",
  "sources": ["<relevant source/methodology 1>", "<source 2>"],
  "confidence": "<high|medium|low>",
  "category": "<market|competitor|trend|regulation|technology>"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: question }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in market-insights-chat:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
