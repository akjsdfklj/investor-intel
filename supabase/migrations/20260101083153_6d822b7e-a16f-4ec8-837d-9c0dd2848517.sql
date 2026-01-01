-- Fix function search path for security
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Recreate triggers
CREATE TRIGGER update_pipeline_deals_updated_at BEFORE UPDATE ON public.pipeline_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deal_sources_updated_at BEFORE UPDATE ON public.deal_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_screening_notes_updated_at BEFORE UPDATE ON public.screening_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_term_sheets_updated_at BEFORE UPDATE ON public.term_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolio_companies_updated_at BEFORE UPDATE ON public.portfolio_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();