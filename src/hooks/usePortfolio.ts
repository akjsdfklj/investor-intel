import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioCompany, PortfolioStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreatePortfolioCompanyInput {
  dealId?: string;
  name: string;
  sector?: string;
  websiteUrl?: string;
  founderName?: string;
  founderEmail?: string;
  investmentDate: string;
  investmentAmount: number;
  ownershipPercentage?: number;
  valuationAtInvestment?: number;
  currentValuation?: number;
  notes?: string;
}

function mapDbToPortfolioCompany(row: any): PortfolioCompany {
  return {
    id: row.id,
    dealId: row.deal_id,
    name: row.name,
    sector: row.sector,
    websiteUrl: row.website_url,
    founderName: row.founder_name,
    founderEmail: row.founder_email,
    investmentDate: row.investment_date,
    investmentAmount: row.investment_amount,
    ownershipPercentage: row.ownership_percentage,
    valuationAtInvestment: row.valuation_at_investment,
    currentValuation: row.current_valuation,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePortfolio() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('portfolio_companies')
      .select('*')
      .order('investment_date', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio companies:', error);
      toast({ title: 'Error', description: 'Failed to fetch portfolio', variant: 'destructive' });
    } else {
      setCompanies((data || []).map(mapDbToPortfolioCompany));
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (input: CreatePortfolioCompanyInput): Promise<PortfolioCompany | null> => {
    const { data, error } = await supabase
      .from('portfolio_companies')
      .insert({
        deal_id: input.dealId,
        name: input.name,
        sector: input.sector,
        website_url: input.websiteUrl,
        founder_name: input.founderName,
        founder_email: input.founderEmail,
        investment_date: input.investmentDate,
        investment_amount: input.investmentAmount,
        ownership_percentage: input.ownershipPercentage,
        valuation_at_investment: input.valuationAtInvestment,
        current_valuation: input.currentValuation || input.valuationAtInvestment,
        status: 'active',
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating portfolio company:', error);
      toast({ title: 'Error', description: 'Failed to add company', variant: 'destructive' });
      return null;
    }

    const newCompany = mapDbToPortfolioCompany(data);
    setCompanies(prev => [newCompany, ...prev]);
    toast({ title: 'Success', description: 'Company added to portfolio' });
    return newCompany;
  };

  const updateCompany = async (id: string, updates: Partial<PortfolioCompany>): Promise<boolean> => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sector !== undefined) dbUpdates.sector = updates.sector;
    if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
    if (updates.founderName !== undefined) dbUpdates.founder_name = updates.founderName;
    if (updates.founderEmail !== undefined) dbUpdates.founder_email = updates.founderEmail;
    if (updates.investmentAmount !== undefined) dbUpdates.investment_amount = updates.investmentAmount;
    if (updates.ownershipPercentage !== undefined) dbUpdates.ownership_percentage = updates.ownershipPercentage;
    if (updates.valuationAtInvestment !== undefined) dbUpdates.valuation_at_investment = updates.valuationAtInvestment;
    if (updates.currentValuation !== undefined) dbUpdates.current_valuation = updates.currentValuation;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase
      .from('portfolio_companies')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating portfolio company:', error);
      toast({ title: 'Error', description: 'Failed to update company', variant: 'destructive' });
      return false;
    }

    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('portfolio_companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting portfolio company:', error);
      toast({ title: 'Error', description: 'Failed to delete company', variant: 'destructive' });
      return false;
    }

    setCompanies(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Deleted', description: 'Company removed from portfolio' });
    return true;
  };

  const getCompanyById = useCallback((id: string): PortfolioCompany | undefined => {
    return companies.find(c => c.id === id);
  }, [companies]);

  const getCompanyByDealId = useCallback((dealId: string): PortfolioCompany | undefined => {
    return companies.find(c => c.dealId === dealId);
  }, [companies]);

  // Calculate fund metrics
  const metrics = {
    totalAUM: companies.reduce((sum, c) => sum + (c.investmentAmount || 0), 0),
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    exitedCompanies: companies.filter(c => c.status === 'exited').length,
    totalCurrentValue: companies.reduce((sum, c) => sum + (c.currentValuation ? c.currentValuation * (c.ownershipPercentage || 0) / 100 : 0), 0),
  };

  return {
    companies,
    isLoading,
    metrics,
    refetch: fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    getCompanyByDealId,
  };
}
