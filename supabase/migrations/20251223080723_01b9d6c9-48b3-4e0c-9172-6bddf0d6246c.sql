-- Drop the existing RLS policy that depends on deal_id
DROP POLICY IF EXISTS "Users can view inquiries for their deals" ON public.founder_inquiries;

-- Drop the foreign key constraint
ALTER TABLE public.founder_inquiries DROP CONSTRAINT IF EXISTS founder_inquiries_deal_id_fkey;

-- Change deal_id column type to text to support localStorage-style IDs
ALTER TABLE public.founder_inquiries ALTER COLUMN deal_id TYPE text;

-- Recreate a simpler RLS policy for viewing inquiries (allow all since we removed auth)
CREATE POLICY "Anyone can view founder inquiries"
ON public.founder_inquiries
FOR SELECT
USING (true);