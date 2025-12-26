-- Fix 1: Make pitch-decks bucket private (if it exists)
UPDATE storage.buckets SET public = false WHERE id = 'pitch-decks';

-- Fix 2: Drop overly permissive storage policies and create secure ones
DROP POLICY IF EXISTS "Anyone can upload pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Public pitch deck access" ON storage.objects;

-- Create secure storage policies for pitch-decks bucket
-- Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload pitch decks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only view their own pitch decks
CREATE POLICY "Users can view own pitch decks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only update their own pitch decks
CREATE POLICY "Users can update own pitch decks"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pitch-decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only delete their own pitch decks
CREATE POLICY "Users can delete own pitch decks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 3: Update founder_inquiries RLS policies
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view founder inquiries" ON public.founder_inquiries;

-- Create a more restrictive policy: only deal owners can view inquiries
-- Note: founder_inquiries.deal_id is TEXT, deals.id is UUID
CREATE POLICY "Users can view inquiries for their deals"
ON public.founder_inquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id::text = founder_inquiries.deal_id 
    AND deals.user_id = auth.uid()
  )
);