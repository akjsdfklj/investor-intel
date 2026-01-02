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
    refetch: fetchDeals,
  };
}
