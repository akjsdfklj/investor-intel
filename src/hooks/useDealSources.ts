import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DealSource, DealSourceType, AirtableConfig, GSheetsConfig, SyncResult } from '@/types';
import { toast } from 'sonner';

export function useDealSources() {
  const [sources, setSources] = useState<DealSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deal_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: DealSource[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        sourceType: row.source_type as DealSourceType,
        config: row.config as unknown as AirtableConfig | GSheetsConfig,
        isActive: row.is_active ?? true,
        syncStatus: (row.sync_status as DealSource['syncStatus']) || 'pending',
        lastSyncAt: row.last_sync_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setSources(mapped);
    } catch (error) {
      console.error('Error fetching deal sources:', error);
      toast.error('Failed to load deal sources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const createSource = async (
    name: string,
    sourceType: DealSourceType,
    config: AirtableConfig | GSheetsConfig
  ) => {
    try {
      const { data, error } = await supabase
        .from('deal_sources')
        .insert([{
          name,
          source_type: sourceType,
          config: JSON.parse(JSON.stringify(config)),
          is_active: true,
          sync_status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal source created');
      await fetchSources();
      return data;
    } catch (error) {
      console.error('Error creating deal source:', error);
      toast.error('Failed to create deal source');
      throw error;
    }
  };

  const updateSource = async (
    id: string,
    updates: Partial<{ name: string; config: AirtableConfig | GSheetsConfig; isActive: boolean }>
  ) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.config) dbUpdates.config = updates.config;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { error } = await supabase
        .from('deal_sources')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Deal source updated');
      await fetchSources();
    } catch (error) {
      console.error('Error updating deal source:', error);
      toast.error('Failed to update deal source');
      throw error;
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deal_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Deal source deleted');
      await fetchSources();
    } catch (error) {
      console.error('Error deleting deal source:', error);
      toast.error('Failed to delete deal source');
      throw error;
    }
  };

  const syncSource = async (id: string): Promise<SyncResult | null> => {
    const source = sources.find((s) => s.id === id);
    if (!source) {
      toast.error('Source not found');
      return null;
    }

    try {
      // Update status to syncing
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'syncing' })
        .eq('id', id);

      // Call appropriate edge function
      const functionName = source.sourceType === 'airtable' ? 'sync-airtable' : 'sync-gsheets';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { sourceId: id },
      });

      if (error) throw error;

      toast.success(`Synced ${data.dealsCreated} new deals, updated ${data.dealsUpdated}`);
      await fetchSources();
      
      return data as SyncResult;
    } catch (error) {
      console.error('Error syncing source:', error);
      toast.error('Failed to sync deal source');
      
      // Update status to error
      await supabase
        .from('deal_sources')
        .update({ sync_status: 'error' })
        .eq('id', id);
      
      await fetchSources();
      return null;
    }
  };

  return {
    sources,
    isLoading,
    createSource,
    updateSource,
    deleteSource,
    syncSource,
    refetch: fetchSources,
  };
}
