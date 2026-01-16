-- Create table to store Google OAuth tokens for Sheets access
CREATE TABLE public.google_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['https://www.googleapis.com/auth/spreadsheets.readonly'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Allow all operations (internal use via edge functions with service role)
CREATE POLICY "Allow all operations on google_oauth_tokens"
  ON public.google_oauth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();