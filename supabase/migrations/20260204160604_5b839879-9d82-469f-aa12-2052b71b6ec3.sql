-- Drop the existing check constraint
ALTER TABLE public.pipeline_deals DROP CONSTRAINT IF EXISTS pipeline_deals_source_type_check;

-- Add the updated check constraint with gsheets and notion
ALTER TABLE public.pipeline_deals ADD CONSTRAINT pipeline_deals_source_type_check 
CHECK (source_type = ANY (ARRAY['airtable'::text, 'gforms'::text, 'gsheets'::text, 'notion'::text, 'manual'::text, 'bulk_dd'::text]));