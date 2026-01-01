-- Pipeline deals table (master table for deal pipeline)
CREATE TABLE public.pipeline_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  sector TEXT,
  stage TEXT NOT NULL DEFAULT 'sourcing' CHECK (stage IN ('sourcing', 'screening', 'dd', 'ic_review', 'term_sheet', 'closed', 'passed')),
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('airtable', 'gforms', 'manual', 'bulk_dd')),
  source_id TEXT,
  pitch_deck_url TEXT,
  pitch_deck_content TEXT,
  founder_name TEXT,
  founder_email TEXT,
  ask_amount DECIMAL(15,2),
  valuation DECIMAL(15,2),
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  assigned_to TEXT,
  dd_report_id TEXT,
  stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal sources configuration (Airtable/GForms connections)
CREATE TABLE public.deal_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('airtable', 'gforms')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Screening notes
CREATE TABLE public.screening_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.pipeline_deals(id) ON DELETE CASCADE,
  team_score INTEGER CHECK (team_score >= 0 AND team_score <= 10),
  market_score INTEGER CHECK (market_score >= 0 AND market_score <= 10),
  product_score INTEGER CHECK (product_score >= 0 AND product_score <= 10),
  timing_score INTEGER CHECK (timing_score >= 0 AND timing_score <= 10),
  notes TEXT,
  decision TEXT CHECK (decision IN ('pass', 'advance', 'pending', 'request_info')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IC Reviews
CREATE TABLE public.ic_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.pipeline_deals(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'pass', 'more_info')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Term sheets
CREATE TABLE public.term_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.pipeline_deals(id) ON DELETE CASCADE,
  template_type TEXT DEFAULT 'safe' CHECK (template_type IN ('safe', 'convertible_note', 'equity')),
  investment_amount DECIMAL(15,2),
  valuation_cap DECIMAL(15,2),
  discount_rate DECIMAL(5,2),
  pro_rata_rights BOOLEAN DEFAULT true,
  google_doc_id TEXT,
  google_doc_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'negotiating', 'signed', 'closed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  recipient_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolio companies (funded companies)
CREATE TABLE public.portfolio_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.pipeline_deals(id),
  name TEXT NOT NULL,
  website_url TEXT,
  sector TEXT,
  investment_date DATE NOT NULL,
  investment_amount DECIMAL(15,2) NOT NULL,
  ownership_percentage DECIMAL(5,2),
  valuation_at_investment DECIMAL(15,2),
  current_valuation DECIMAL(15,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exited', 'written_off')),
  founder_name TEXT,
  founder_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolio KPIs
CREATE TABLE public.portfolio_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
  period_date DATE NOT NULL,
  mrr DECIMAL(15,2),
  arr DECIMAL(15,2),
  revenue DECIMAL(15,2),
  customers INTEGER,
  burn_rate DECIMAL(15,2),
  runway_months INTEGER,
  headcount INTEGER,
  churn_rate DECIMAL(5,2),
  nps_score INTEGER,
  notes TEXT,
  submitted_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Founder portal access
CREATE TABLE public.founder_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fund transactions (for fund flow tracking)
CREATE TABLE public.fund_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.portfolio_companies(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('capital_call', 'investment', 'follow_on', 'distribution', 'fee', 'exit')),
  amount DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pipeline_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (since app doesn't use auth)
CREATE POLICY "Allow all operations on pipeline_deals" ON public.pipeline_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on deal_sources" ON public.deal_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on screening_notes" ON public.screening_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ic_reviews" ON public.ic_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on term_sheets" ON public.term_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on portfolio_companies" ON public.portfolio_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on portfolio_kpis" ON public.portfolio_kpis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on founder_portal_access" ON public.founder_portal_access FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on fund_transactions" ON public.fund_transactions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_pipeline_deals_stage ON public.pipeline_deals(stage);
CREATE INDEX idx_pipeline_deals_source_type ON public.pipeline_deals(source_type);
CREATE INDEX idx_screening_notes_deal_id ON public.screening_notes(deal_id);
CREATE INDEX idx_ic_reviews_deal_id ON public.ic_reviews(deal_id);
CREATE INDEX idx_term_sheets_deal_id ON public.term_sheets(deal_id);
CREATE INDEX idx_portfolio_kpis_company_id ON public.portfolio_kpis(company_id);
CREATE INDEX idx_portfolio_kpis_period_date ON public.portfolio_kpis(period_date);
CREATE INDEX idx_fund_transactions_company_id ON public.fund_transactions(company_id);
CREATE INDEX idx_fund_transactions_date ON public.fund_transactions(transaction_date);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_pipeline_deals_updated_at BEFORE UPDATE ON public.pipeline_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deal_sources_updated_at BEFORE UPDATE ON public.deal_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_screening_notes_updated_at BEFORE UPDATE ON public.screening_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_term_sheets_updated_at BEFORE UPDATE ON public.term_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolio_companies_updated_at BEFORE UPDATE ON public.portfolio_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();