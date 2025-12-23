import { useState, useEffect, useCallback } from 'react';
import { Deal, DDReport } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDeals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch deals from Supabase
  const fetchDeals = useCallback(async () => {
    if (!user) {
      setDeals([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      // Fetch DD reports for all deals
      const dealIds = dealsData?.map(d => d.id) || [];
      let reportsMap: Record<string, DDReport> = {};

      if (dealIds.length > 0) {
        const { data: reportsData, error: reportsError } = await supabase
          .from('dd_reports')
          .select('*')
          .in('deal_id', dealIds);

        if (!reportsError && reportsData) {
          reportsData.forEach(report => {
            reportsMap[report.deal_id] = {
              id: report.id,
              dealId: report.deal_id,
              summary: report.summary || '',
              scores: {
                team: { score: report.team_score || 0, reason: report.team_reason || '' },
                market: { score: report.market_score || 0, reason: report.market_reason || '' },
                product: { score: report.product_score || 0, reason: report.product_reason || '' },
                moat: { score: report.moat_score || 0, reason: report.moat_reason || '' },
              },
              followUpQuestions: report.follow_up_questions || [],
              generatedAt: report.created_at,
              scrapedContent: report.scraped_content || undefined,
            };
          });
        }
      }

      const formattedDeals: Deal[] = (dealsData || []).map(d => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        url: d.url || undefined,
        description: d.description || undefined,
        createdAt: d.created_at,
        ddReport: reportsMap[d.id],
      }));

      setDeals(formattedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deals',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = useCallback(async (data: { name: string; url?: string; description?: string }): Promise<{ success: boolean; error?: string; deal?: Deal }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check deal limit for free users
    if (user.plan === 'free' && deals.length >= 3) {
      return { success: false, error: 'Free tier limit reached (3 deals). Upgrade to Pro for unlimited deals.' };
    }

    try {
      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          name: data.name,
          url: data.url || null,
          description: data.description || null,
        })
        .select()
        .single();

      if (error) throw error;

      const formattedDeal: Deal = {
        id: newDeal.id,
        userId: newDeal.user_id,
        name: newDeal.name,
        url: newDeal.url || undefined,
        description: newDeal.description || undefined,
        createdAt: newDeal.created_at,
      };

      setDeals(prev => [formattedDeal, ...prev]);
      return { success: true, deal: formattedDeal };
    } catch (error) {
      console.error('Error creating deal:', error);
      return { success: false, error: 'Failed to create deal' };
    }
  }, [user, deals.length]);

  const generateDD = useCallback(async (dealId: string): Promise<{ success: boolean; error?: string }> => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }

    try {
      let scrapedContent = '';

      // Step 1: Scrape website if URL provided
      if (deal.url) {
        toast({
          title: 'Crawling website...',
          description: `Analyzing ${deal.url}`,
        });

        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
          body: { url: deal.url },
        });

        if (scrapeError) {
          console.error('Scrape error:', scrapeError);
        } else if (scrapeData?.success) {
          scrapedContent = scrapeData.markdown || '';
        }
      }

      // Step 2: Generate DD with AI
      toast({
        title: 'Generating analysis...',
        description: 'AI is analyzing the startup',
      });

      const { data: ddData, error: ddError } = await supabase.functions.invoke('generate-dd', {
        body: {
          dealName: deal.name,
          dealUrl: deal.url,
          dealDescription: deal.description,
          scrapedContent,
        },
      });

      if (ddError) throw ddError;

      if (ddData.error) {
        throw new Error(ddData.error);
      }

      // Step 3: Save DD report to database
      const { data: savedReport, error: saveError } = await supabase
        .from('dd_reports')
        .insert({
          deal_id: dealId,
          summary: ddData.summary,
          team_score: ddData.team_score,
          team_reason: ddData.team_reason,
          market_score: ddData.market_score,
          market_reason: ddData.market_reason,
          product_score: ddData.product_score,
          product_reason: ddData.product_reason,
          moat_score: ddData.moat_score,
          moat_reason: ddData.moat_reason,
          follow_up_questions: ddData.follow_up_questions,
          scraped_content: scrapedContent || null,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Update local state
      const ddReport: DDReport = {
        id: savedReport.id,
        dealId: savedReport.deal_id,
        summary: savedReport.summary || '',
        scores: {
          team: { score: savedReport.team_score || 0, reason: savedReport.team_reason || '' },
          market: { score: savedReport.market_score || 0, reason: savedReport.market_reason || '' },
          product: { score: savedReport.product_score || 0, reason: savedReport.product_reason || '' },
          moat: { score: savedReport.moat_score || 0, reason: savedReport.moat_reason || '' },
        },
        followUpQuestions: savedReport.follow_up_questions || [],
        generatedAt: savedReport.created_at,
        scrapedContent: savedReport.scraped_content || undefined,
      };

      setDeals(prev => prev.map(d => 
        d.id === dealId ? { ...d, ddReport } : d
      ));

      toast({
        title: 'Success!',
        description: 'Due diligence report generated',
      });

      return { success: true };
    } catch (error) {
      console.error('Error generating DD:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate DD';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  }, [deals, toast]);

  const deleteDeal = useCallback(async (dealId: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev => prev.filter(d => d.id !== dealId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast]);

  const getDeal = useCallback((dealId: string): Deal | undefined => {
    return deals.find(d => d.id === dealId);
  }, [deals]);

  const canCreateDeal = user?.plan === 'pro' || deals.length < 3;
  const dealsRemaining = user?.plan === 'pro' ? Infinity : Math.max(0, 3 - deals.length);

  return {
    deals,
    isLoading,
    createDeal,
    generateDD,
    deleteDeal,
    getDeal,
    canCreateDeal,
    dealsRemaining,
    refetch: fetchDeals,
  };
}
