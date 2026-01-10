-- Fix DD reports to work with pipeline deals (and match pipeline_deals access model)

-- Ensure RLS is enabled (already enabled, but keep idempotent)
ALTER TABLE public.dd_reports ENABLE ROW LEVEL SECURITY;

-- Drop old policies that referenced public.deals
DROP POLICY IF EXISTS "Users can view reports for their deals" ON public.dd_reports;
DROP POLICY IF EXISTS "Users can create reports for their deals" ON public.dd_reports;

-- Replace the foreign key to point at pipeline_deals instead of deals
ALTER TABLE public.dd_reports DROP CONSTRAINT IF EXISTS dd_reports_deal_id_fkey;
ALTER TABLE public.dd_reports
  ADD CONSTRAINT dd_reports_deal_id_fkey
  FOREIGN KEY (deal_id)
  REFERENCES public.pipeline_deals(id)
  ON DELETE CASCADE;

-- Create permissive policies to match pipeline_deals (currently open)
CREATE POLICY "Allow all operations on dd_reports"
ON public.dd_reports
FOR ALL
USING (true)
WITH CHECK (true);
