import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PipelineDeal, PipelineStage } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Convert snake_case DB response to camelCase
const mapDbToPipelineDeal = (row: any): PipelineDeal => ({
  id: row.id,
  name: row.name,
  websiteUrl: row.website_url,
  description: row.description,
  stage: row.stage as PipelineStage,
  stageEnteredAt: row.stage_entered_at,
  priority: row.priority || 2,
  sector: row.sector,
  sourceType: row.source_type || 'manual',
  sourceId: row.source_id,
  founderName: row.founder_name,
  founderEmail: row.founder_email,
  pitchDeckUrl: row.pitch_deck_url,
  pitchDeckContent: row.pitch_deck_content,
  askAmount: row.ask_amount,
  valuation: row.valuation,
  assignedTo: row.assigned_to,
  ddReportId: row.dd_report_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function usePipelineDeals() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all pipeline deals
  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pipeline_deals')
        .select('*')
        .order('stage_entered_at', { ascending: false });

      if (error) throw error;
      setDeals((data || []).map(mapDbToPipelineDeal));
    } catch (error: any) {
      console.error('Error fetching pipeline deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pipeline deals',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create a new pipeline deal
  const createDeal = async (deal: Partial<PipelineDeal>) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_deals')
        .insert({
          name: deal.name,
          website_url: deal.websiteUrl,
          description: deal.description,
          stage: deal.stage || 'sourcing',
          priority: deal.priority || 2,
          sector: deal.sector,
          source_type: deal.sourceType || 'manual',
          founder_name: deal.founderName,
          founder_email: deal.founderEmail,
          pitch_deck_url: deal.pitchDeckUrl,
          ask_amount: deal.askAmount,
          valuation: deal.valuation,
          assigned_to: deal.assignedTo,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newDeal = mapDbToPipelineDeal(data);
      setDeals(prev => [newDeal, ...prev]);
      
      toast({
        title: 'Deal Created',
        description: `${deal.name} added to pipeline`,
      });
      
      return { success: true, deal: newDeal };
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create deal',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  // Update deal stage (for drag-drop)
  const updateDealStage = async (dealId: string, newStage: PipelineStage) => {
    try {
      const { error } = await supabase
        .from('pipeline_deals')
        .update({
          stage: newStage,
          stage_entered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev =>
        prev.map(d =>
          d.id === dealId
            ? { ...d, stage: newStage, stageEnteredAt: new Date().toISOString() }
            : d
        )
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error updating deal stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to move deal',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  // Update deal details
  const updateDeal = async (dealId: string, updates: Partial<PipelineDeal>) => {
    try {
      const { error } = await supabase
        .from('pipeline_deals')
        .update({
          name: updates.name,
          website_url: updates.websiteUrl,
          description: updates.description,
          priority: updates.priority,
          sector: updates.sector,
          founder_name: updates.founderName,
          founder_email: updates.founderEmail,
          ask_amount: updates.askAmount,
          valuation: updates.valuation,
          assigned_to: updates.assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev =>
        prev.map(d => (d.id === dealId ? { ...d, ...updates } : d))
      );

      toast({
        title: 'Deal Updated',
        description: 'Changes saved successfully',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update deal',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  // Delete deal
  const deleteDeal = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev => prev.filter(d => d.id !== dealId));

      toast({
        title: 'Deal Deleted',
        description: 'Deal removed from pipeline',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  // Get deals by stage
  const getDealsByStage = (stage: PipelineStage) => {
    return deals.filter(d => d.stage === stage);
  };

  // Generate DD report for a deal
  const generateDDForDeal = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) {
      toast({
        title: 'Error',
        description: 'Deal not found',
        variant: 'destructive',
      });
      return { success: false, error: 'Deal not found' };
    }

    try {
      // Step 1: Scrape website if URL exists
      let scrapedContent = '';
      if (deal.websiteUrl) {
        console.log('Scraping website:', deal.websiteUrl);
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
          body: { url: deal.websiteUrl }
        });
        if (!scrapeError && scrapeData?.markdown) {
          scrapedContent = scrapeData.markdown;
        }
      }

      // Step 2: Generate DD report using AI
      console.log('Generating DD report for:', deal.name);
      const { data: ddData, error: ddError } = await supabase.functions.invoke('generate-dd', {
        body: {
          dealName: deal.name,
          dealUrl: deal.websiteUrl || '',
          dealDescription: deal.description || '',
          scrapedContent,
          pitchDeckContent: deal.pitchDeckContent || ''
        }
      });

      if (ddError) {
        throw new Error(ddError.message || 'Failed to generate DD report');
      }

      if (ddData?.error) {
        throw new Error(ddData.error);
      }

      // Step 3: Save DD report to database with all advanced analysis fields
      const { data: report, error: insertError } = await supabase
        .from('dd_reports')
        .insert({
          deal_id: dealId,
          summary: ddData.summary || '',
          team_score: ddData.team_score || ddData.scores?.team?.score,
          team_reason: ddData.team_reason || ddData.scores?.team?.reason,
          market_score: ddData.market_score || ddData.scores?.market?.score,
          market_reason: ddData.market_reason || ddData.scores?.market?.reason,
          product_score: ddData.product_score || ddData.scores?.product?.score,
          product_reason: ddData.product_reason || ddData.scores?.product?.reason,
          moat_score: ddData.moat_score || ddData.scores?.moat?.score,
          moat_reason: ddData.moat_reason || ddData.scores?.moat?.reason,
          follow_up_questions: ddData.follow_up_questions || ddData.followUpQuestions,
          scraped_content: scrapedContent,
          // Advanced analysis fields
          pitch_sanity_check: ddData.pitchSanityCheck || ddData.pitch_sanity_check || null,
          swot_analysis: ddData.swotAnalysis || ddData.swot_analysis || null,
          moat_assessment: ddData.moatAssessment || ddData.moat_assessment || null,
          competitor_mapping: ddData.competitorMapping || ddData.competitor_mapping || null,
          investment_success_rate: ddData.investmentSuccessRate || ddData.investment_success_rate || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Step 4: Link DD report to the deal
      await supabase
        .from('pipeline_deals')
        .update({ dd_report_id: report.id })
        .eq('id', dealId);

      // Update local state
      setDeals(prev =>
        prev.map(d => (d.id === dealId ? { ...d, ddReportId: report.id } : d))
      );

      toast({
        title: 'DD Report Generated',
        description: `Due diligence report created for ${deal.name}`,
      });

      return { success: true, report };
    } catch (error: any) {
      console.error('Error generating DD report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate DD report',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel('pipeline-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_deals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDeal = mapDbToPipelineDeal(payload.new);
            setDeals(prev => [newDeal, ...prev.filter(d => d.id !== newDeal.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedDeal = mapDbToPipelineDeal(payload.new);
            setDeals(prev =>
              prev.map(d => (d.id === updatedDeal.id ? updatedDeal : d))
            );
          } else if (payload.eventType === 'DELETE') {
            setDeals(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDeals]);

  return {
    deals,
    isLoading,
    createDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    getDealsByStage,
    generateDDForDeal,
    refetch: fetchDeals,
  };
}
