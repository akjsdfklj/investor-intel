-- Add advanced analysis fields to dd_reports table
ALTER TABLE public.dd_reports
ADD COLUMN IF NOT EXISTS pitch_sanity_check JSONB,
ADD COLUMN IF NOT EXISTS swot_analysis JSONB,
ADD COLUMN IF NOT EXISTS moat_assessment JSONB,
ADD COLUMN IF NOT EXISTS competitor_mapping JSONB,
ADD COLUMN IF NOT EXISTS investment_success_rate JSONB;

-- Add content field to term_sheets for editable document
ALTER TABLE public.term_sheets
ADD COLUMN IF NOT EXISTS content TEXT;