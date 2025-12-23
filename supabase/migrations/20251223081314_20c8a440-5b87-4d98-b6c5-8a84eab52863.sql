-- Create storage bucket for pitch decks
INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-decks', 'pitch-decks', true);

-- Create policies for pitch deck uploads
CREATE POLICY "Anyone can upload pitch decks"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pitch-decks');

CREATE POLICY "Anyone can view pitch decks"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pitch-decks');

CREATE POLICY "Anyone can update pitch decks"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'pitch-decks');

CREATE POLICY "Anyone can delete pitch decks"
ON storage.objects
FOR DELETE
USING (bucket_id = 'pitch-decks');