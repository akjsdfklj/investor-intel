import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// The redirect URI will be the edge function URL
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  try {
    // Check if this is a callback from Google (GET with code parameter)
    if (req.method === 'GET' && url.searchParams.get('code')) {
      return handleOAuthCallback(url);
    }
    
    // Handle POST requests from frontend
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'get_auth_url') {
        return getAuthUrl();
      }
      
      if (body.action === 'get_token') {
        return getStoredToken();
      }
      
      if (body.action === 'refresh_token') {
        return refreshAccessToken(body.refreshToken);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getAuthUrl() {
  if (!GOOGLE_CLIENT_ID) {
    return new Response(
      JSON.stringify({ error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID secret.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('Generated auth URL with redirect:', REDIRECT_URI);

  return new Response(
    JSON.stringify({ authUrl: authUrl.toString() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleOAuthCallback(url: URL) {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('OAuth error from Google:', error);
    return createCallbackResponse(false, error);
  }

  if (!code) {
    return createCallbackResponse(false, 'No authorization code received');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return createCallbackResponse(false, tokens.error_description || tokens.error);
    }

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    console.log('Successfully authenticated user:', email);

    // Store tokens in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert token (update if email exists, insert if not)
    const { error: upsertError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_email: email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt.toISOString(),
        scopes: SCOPES.split(' '),
      }, {
        onConflict: 'user_email',
      });

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      return createCallbackResponse(false, 'Failed to store authentication');
    }

    return createCallbackResponse(true, undefined, email);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return createCallbackResponse(false, message);
  }
}

function createCallbackResponse(success: boolean, error?: string, email?: string) {
  // Return HTML page that sends message to opener and closes
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google Authentication</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .success { color: #10b981; }
        .error { color: #ef4444; }
      </style>
    </head>
    <body>
      <div class="container">
        ${success ? `
          <h2 class="success">✓ Connected Successfully</h2>
          <p>Signed in as ${email}</p>
          <p>This window will close automatically...</p>
        ` : `
          <h2 class="error">✗ Connection Failed</h2>
          <p>${error || 'An error occurred'}</p>
          <p>You can close this window and try again.</p>
        `}
      </div>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: '${success ? 'google-oauth-success' : 'google-oauth-error'}',
            ${success ? `email: '${email}'` : `error: '${error}'`}
          }, '*');
          setTimeout(() => window.close(), 2000);
        }
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

async function getStoredToken() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: 'No token found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Token expired, try to refresh
    if (data.refresh_token) {
      const refreshResult = await refreshAccessToken(data.refresh_token);
      return refreshResult;
    }
    return new Response(
      JSON.stringify({ error: 'Token expired and no refresh token available' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ 
      accessToken: data.access_token,
      email: data.user_email,
      expiresAt: data.expires_at,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token refresh error:', tokens);
      return new Response(
        JSON.stringify({ error: tokens.error_description || tokens.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update token in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: updateError } = await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('refresh_token', refreshToken);

    if (updateError) {
      console.error('Failed to update token:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        accessToken: tokens.access_token,
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Token refresh error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
