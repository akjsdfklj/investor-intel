import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioKPI, KPIPeriodType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateKPIInput {
  companyId: string;
  periodType: KPIPeriodType;
  periodDate: string;
  revenue?: number;
  mrr?: number;
  arr?: number;
  customers?: number;
  burnRate?: number;
  runwayMonths?: number;
  churnRate?: number;
  headcount?: number;
  npsScore?: number;
  notes?: string;
  submittedBy?: string;
}

function mapDbToKPI(row: any): PortfolioKPI {
  return {
    id: row.id,
    companyId: row.company_id,
    periodType: row.period_type,
    periodDate: row.period_date,
    revenue: row.revenue,
    mrr: row.mrr,
    arr: row.arr,
    customers: row.customers,
    burnRate: row.burn_rate,
    runwayMonths: row.runway_months,
    churnRate: row.churn_rate,
    headcount: row.headcount,
    npsScore: row.nps_score,
    notes: row.notes,
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
  };
}

export function usePortfolioKPIs(companyId?: string) {
  const [kpis, setKPIs] = useState<PortfolioKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchKPIs = useCallback(async () => {
    if (!companyId) {
      setKPIs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('portfolio_kpis')
      .select('*')
      .eq('company_id', companyId)
      .order('period_date', { ascending: false });

    if (error) {
      console.error('Error fetching KPIs:', error);
      toast({ title: 'Error', description: 'Failed to fetch KPIs', variant: 'destructive' });
    } else {
      setKPIs((data || []).map(mapDbToKPI));
    }
    setIsLoading(false);
  }, [companyId, toast]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const createKPI = async (input: CreateKPIInput): Promise<PortfolioKPI | null> => {
    const { data, error } = await supabase
      .from('portfolio_kpis')
      .insert({
        company_id: input.companyId,
        period_type: input.periodType,
        period_date: input.periodDate,
        revenue: input.revenue,
        mrr: input.mrr,
        arr: input.arr,
        customers: input.customers,
        burn_rate: input.burnRate,
        runway_months: input.runwayMonths,
        churn_rate: input.churnRate,
        headcount: input.headcount,
        nps_score: input.npsScore,
        notes: input.notes,
        submitted_by: input.submittedBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating KPI:', error);
      toast({ title: 'Error', description: 'Failed to add KPI', variant: 'destructive' });
      return null;
    }

    const newKPI = mapDbToKPI(data);
    setKPIs(prev => [newKPI, ...prev]);
    toast({ title: 'Success', description: 'KPI added' });
    return newKPI;
  };

  const updateKPI = async (id: string, updates: Partial<CreateKPIInput>): Promise<boolean> => {
    const dbUpdates: any = {};
    
    if (updates.periodType !== undefined) dbUpdates.period_type = updates.periodType;
    if (updates.periodDate !== undefined) dbUpdates.period_date = updates.periodDate;
    if (updates.revenue !== undefined) dbUpdates.revenue = updates.revenue;
    if (updates.mrr !== undefined) dbUpdates.mrr = updates.mrr;
    if (updates.arr !== undefined) dbUpdates.arr = updates.arr;
    if (updates.customers !== undefined) dbUpdates.customers = updates.customers;
    if (updates.burnRate !== undefined) dbUpdates.burn_rate = updates.burnRate;
    if (updates.runwayMonths !== undefined) dbUpdates.runway_months = updates.runwayMonths;
    if (updates.churnRate !== undefined) dbUpdates.churn_rate = updates.churnRate;
    if (updates.headcount !== undefined) dbUpdates.headcount = updates.headcount;
    if (updates.npsScore !== undefined) dbUpdates.nps_score = updates.npsScore;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.submittedBy !== undefined) dbUpdates.submitted_by = updates.submittedBy;

    const { error } = await supabase
      .from('portfolio_kpis')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating KPI:', error);
      toast({ title: 'Error', description: 'Failed to update KPI', variant: 'destructive' });
      return false;
    }

    setKPIs(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    return true;
  };

  const deleteKPI = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('portfolio_kpis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting KPI:', error);
      toast({ title: 'Error', description: 'Failed to delete KPI', variant: 'destructive' });
      return false;
    }

    setKPIs(prev => prev.filter(k => k.id !== id));
    return true;
  };

  // Get latest KPI
  const latestKPI = kpis.length > 0 ? kpis[0] : null;

  // Calculate growth metrics
  const calculateGrowth = (metric: keyof PortfolioKPI): number | null => {
    if (kpis.length < 2) return null;
    const current = kpis[0][metric] as number | undefined;
    const previous = kpis[1][metric] as number | undefined;
    if (current === undefined || previous === undefined || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return {
    kpis,
    isLoading,
    latestKPI,
    refetch: fetchKPIs,
    createKPI,
    updateKPI,
    deleteKPI,
    calculateGrowth,
  };
}
