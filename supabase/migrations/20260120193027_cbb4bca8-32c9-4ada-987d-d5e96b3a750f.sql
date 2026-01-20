-- Drop the existing check constraint on source_type
ALTER TABLE public.deal_sources DROP CONSTRAINT IF EXISTS deal_sources_source_type_check;

-- Add updated check constraint that includes all source types
ALTER TABLE public.deal_sources ADD CONSTRAINT deal_sources_source_type_check 
CHECK (source_type IN ('airtable', 'gsheets', 'notion', 'manual'));