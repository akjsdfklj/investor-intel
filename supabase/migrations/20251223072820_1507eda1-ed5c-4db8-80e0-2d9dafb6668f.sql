-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create DD reports table
CREATE TABLE public.dd_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  summary TEXT,
  team_score INTEGER CHECK (team_score >= 1 AND team_score <= 5),
  team_reason TEXT,
  market_score INTEGER CHECK (market_score >= 1 AND market_score <= 5),
  market_reason TEXT,
  product_score INTEGER CHECK (product_score >= 1 AND product_score <= 5),
  product_reason TEXT,
  moat_score INTEGER CHECK (moat_score >= 1 AND moat_score <= 5),
  moat_reason TEXT,
  follow_up_questions TEXT[],
  scraped_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create founder inquiries table
CREATE TABLE public.founder_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  founder_name TEXT NOT NULL,
  founder_email TEXT NOT NULL,
  founder_bio TEXT NOT NULL,
  linkedin_url TEXT,
  additional_info TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS policies for deals
CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for dd_reports (based on deal ownership)
CREATE POLICY "Users can view reports for their deals" ON public.dd_reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.deals WHERE deals.id = dd_reports.deal_id AND deals.user_id = auth.uid()));
CREATE POLICY "Users can create reports for their deals" ON public.dd_reports FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals WHERE deals.id = dd_reports.deal_id AND deals.user_id = auth.uid()));

-- RLS policies for founder_inquiries (anyone can submit, owners can view)
CREATE POLICY "Anyone can submit founder inquiry" ON public.founder_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view inquiries for their deals" ON public.founder_inquiries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.deals WHERE deals.id = founder_inquiries.deal_id AND deals.user_id = auth.uid()));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();