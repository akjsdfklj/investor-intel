// Shared validation utilities for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic error response that doesn't leak internal details
export function errorResponse(status: number, userMessage: string): Response {
  const messages: Record<number, string> = {
    400: 'Invalid request parameters',
    401: 'Authentication required',
    402: 'Usage limit reached',
    429: 'Rate limit exceeded. Please try again later.',
    500: 'An error occurred processing your request. Please try again.',
  };
  
  return new Response(
    JSON.stringify({ error: userMessage || messages[status] || 'Service temporarily unavailable' }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// URL validation - prevents SSRF attacks
export function validateUrl(url: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  let sanitized = url.trim();
  
  // Ensure it starts with http:// or https://
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = `https://${sanitized}`;
  }

  try {
    const parsed = new URL(sanitized);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '10.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.',
      '192.168.',
      '169.254.',
    ];

    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.startsWith(pattern)) {
        return { valid: false, error: 'Invalid URL' };
      }
    }

    // Check for valid TLD (basic check)
    if (!hostname.includes('.') && hostname !== 'localhost') {
      return { valid: false, error: 'URL must have a valid domain' };
    }

    return { valid: true, sanitized };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// String validation with length limits
export function validateString(
  value: unknown, 
  fieldName: string, 
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
): { valid: boolean; sanitized?: string; error?: string } {
  const { required = false, minLength = 0, maxLength = 10000 } = options;

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

// Email validation
export function validateEmail(email: unknown): { valid: boolean; sanitized?: string; error?: string } {
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

// LinkedIn URL validation
export function validateLinkedInUrl(url: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (!url || url === '') {
    return { valid: true, sanitized: '' };
  }

  if (typeof url !== 'string') {
    return { valid: false, error: 'LinkedIn URL must be a string' };
  }

  const sanitized = url.trim().slice(0, 200);

  if (sanitized && !sanitized.includes('linkedin.com')) {
    return { valid: false, error: 'Must be a valid LinkedIn URL' };
  }

  return { valid: true, sanitized };
}

// Authenticate user from request
export async function authenticateUser(req: Request): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    return { user: null, error: 'Server configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user };
}
