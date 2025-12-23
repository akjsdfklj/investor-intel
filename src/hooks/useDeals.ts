import { useState, useEffect, useCallback } from 'react';
import { Deal, DDReport } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'techdd_deals';

export function useDeals() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDeals(JSON.parse(stored));
      } catch {
        setDeals([]);
      }
    }
    setIsLoading(false);
  }, []);

  const saveDeals = useCallback((newDeals: Deal[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDeals));
  }, []);

  const createDeal = useCallback(async (data: { 
    name: string; 
    url?: string; 
    description?: string;
    pitchDeckUrl?: string;
    pitchDeckContent?: string;
  }): Promise<{ success: boolean; error?: string; deal?: Deal }> => {
    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      userId: 'local_user',
      name: data.name,
      url: data.url || undefined,
      description: data.description || undefined,
      pitchDeckUrl: data.pitchDeckUrl || undefined,
      pitchDeckContent: data.pitchDeckContent || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedDeals = [newDeal, ...deals];
    setDeals(updatedDeals);
    saveDeals(updatedDeals);
    return { success: true, deal: newDeal };
  }, [deals, saveDeals]);

  const generateDD = useCallback(async (dealId: string): Promise<{ success: boolean; error?: string }> => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }

    try {
      let scrapedContent = '';

      if (deal.url) {
        toast({ title: 'Crawling website...', description: `Analyzing ${deal.url}` });
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
          body: { url: deal.url },
        });
        if (!scrapeError && scrapeData?.success) {
          scrapedContent = scrapeData.markdown || '';
        }
      }

      toast({ title: 'Generating comprehensive analysis...', description: 'AI is analyzing the startup' });

      const { data: ddData, error: ddError } = await supabase.functions.invoke('generate-dd', {
        body: {
          dealName: deal.name,
          dealUrl: deal.url,
          dealDescription: deal.description,
          scrapedContent,
          pitchDeckContent: deal.pitchDeckContent,
        },
      });

      if (ddError) throw ddError;
      if (ddData.error) throw new Error(ddData.error);

      const ddReport: DDReport = {
        id: `dd_${Date.now()}`,
        dealId: dealId,
        summary: ddData.summary || '',
        scores: {
          team: { score: ddData.team_score || 0, reason: ddData.team_reason || '' },
          market: { score: ddData.market_score || 0, reason: ddData.market_reason || '' },
          product: { score: ddData.product_score || 0, reason: ddData.product_reason || '' },
          moat: { score: ddData.moat_score || 0, reason: ddData.moat_reason || '' },
        },
        followUpQuestions: ddData.follow_up_questions || [],
        generatedAt: new Date().toISOString(),
        scrapedContent: scrapedContent || undefined,
        pitchSanityCheck: ddData.pitch_sanity_check ? {
          status: ddData.pitch_sanity_check.status,
          problem: ddData.pitch_sanity_check.problem,
          solution: ddData.pitch_sanity_check.solution,
          targetCustomer: ddData.pitch_sanity_check.target_customer,
          pricingModel: ddData.pitch_sanity_check.pricing_model,
          keyMetrics: ddData.pitch_sanity_check.key_metrics || [],
          claimedTAM: ddData.pitch_sanity_check.claimed_tam,
          missingInfo: ddData.pitch_sanity_check.missing_info || [],
        } : undefined,
        swotAnalysis: ddData.swot_analysis,
        moatAssessment: ddData.moat_assessment,
        competitorMapping: ddData.competitor_mapping?.map((c: any) => ({
          name: c.name,
          description: c.description,
          country: c.country,
          fundingStage: c.funding_stage,
          websiteUrl: c.website_url,
          comparison: c.comparison,
        })),
        investmentSuccessRate: ddData.investment_success_rate ? {
          probability: ddData.investment_success_rate.probability,
          confidence: ddData.investment_success_rate.confidence,
          reasoning: ddData.investment_success_rate.reasoning,
          keyRisks: ddData.investment_success_rate.key_risks || [],
          keyStrengths: ddData.investment_success_rate.key_strengths || [],
        } : undefined,
      };

      const updatedDeals = deals.map(d => d.id === dealId ? { ...d, ddReport } : d);
      setDeals(updatedDeals);
      saveDeals(updatedDeals);

      toast({ title: 'Success!', description: 'Comprehensive DD report generated' });
      return { success: true };
    } catch (error) {
      console.error('Error generating DD:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate DD';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return { success: false, error: errorMessage };
    }
  }, [deals, saveDeals, toast]);

  const deleteDeal = useCallback(async (dealId: string): Promise<{ success: boolean }> => {
    const updatedDeals = deals.filter(d => d.id !== dealId);
    setDeals(updatedDeals);
    saveDeals(updatedDeals);
    return { success: true };
  }, [deals, saveDeals]);

  const getDeal = useCallback((dealId: string): Deal | undefined => {
    return deals.find(d => d.id === dealId);
  }, [deals]);

  const updateDeal = useCallback((dealId: string, updates: Partial<Deal>) => {
    const updatedDeals = deals.map(d => d.id === dealId ? { ...d, ...updates } : d);
    setDeals(updatedDeals);
    saveDeals(updatedDeals);
  }, [deals, saveDeals]);

  return { deals, isLoading, createDeal, generateDD, deleteDeal, getDeal, updateDeal, canCreateDeal: true, dealsRemaining: Infinity };
}
