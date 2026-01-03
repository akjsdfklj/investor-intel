import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TermSheet, TermSheetTemplate, TermSheetStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateTermSheetInput {
  dealId: string;
  templateType: TermSheetTemplate;
  investmentAmount: number;
  valuationCap?: number;
  discountRate?: number;
  proRataRights?: boolean;
  recipientEmail?: string;
}

function mapDbToTermSheet(row: any): TermSheet {
  return {
    id: row.id,
    dealId: row.deal_id,
    templateType: row.template_type,
    investmentAmount: row.investment_amount,
    valuationCap: row.valuation_cap,
    discountRate: row.discount_rate,
    proRataRights: row.pro_rata_rights,
    googleDocId: row.google_doc_id,
    googleDocUrl: row.google_doc_url,
    status: row.status,
    recipientEmail: row.recipient_email,
    sentAt: row.sent_at,
    openedAt: row.opened_at,
    signedAt: row.signed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTermSheets() {
  const [termSheets, setTermSheets] = useState<TermSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTermSheets = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('term_sheets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching term sheets:', error);
      toast({ title: 'Error', description: 'Failed to fetch term sheets', variant: 'destructive' });
    } else {
      setTermSheets((data || []).map(mapDbToTermSheet));
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTermSheets();
  }, [fetchTermSheets]);

  const getTermSheetByDealId = useCallback((dealId: string): TermSheet | undefined => {
    return termSheets.find(ts => ts.dealId === dealId);
  }, [termSheets]);

  const createTermSheet = async (input: CreateTermSheetInput): Promise<TermSheet | null> => {
    const { data, error } = await supabase
      .from('term_sheets')
      .insert({
        deal_id: input.dealId,
        template_type: input.templateType,
        investment_amount: input.investmentAmount,
        valuation_cap: input.valuationCap,
        discount_rate: input.discountRate,
        pro_rata_rights: input.proRataRights ?? true,
        recipient_email: input.recipientEmail,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating term sheet:', error);
      toast({ title: 'Error', description: 'Failed to create term sheet', variant: 'destructive' });
      return null;
    }

    const newTermSheet = mapDbToTermSheet(data);
    setTermSheets(prev => [newTermSheet, ...prev]);
    toast({ title: 'Success', description: 'Term sheet created' });
    return newTermSheet;
  };

  const updateTermSheet = async (id: string, updates: Partial<TermSheet>): Promise<boolean> => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    
    if (updates.templateType !== undefined) dbUpdates.template_type = updates.templateType;
    if (updates.investmentAmount !== undefined) dbUpdates.investment_amount = updates.investmentAmount;
    if (updates.valuationCap !== undefined) dbUpdates.valuation_cap = updates.valuationCap;
    if (updates.discountRate !== undefined) dbUpdates.discount_rate = updates.discountRate;
    if (updates.proRataRights !== undefined) dbUpdates.pro_rata_rights = updates.proRataRights;
    if (updates.googleDocId !== undefined) dbUpdates.google_doc_id = updates.googleDocId;
    if (updates.googleDocUrl !== undefined) dbUpdates.google_doc_url = updates.googleDocUrl;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.recipientEmail !== undefined) dbUpdates.recipient_email = updates.recipientEmail;
    if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
    if (updates.openedAt !== undefined) dbUpdates.opened_at = updates.openedAt;
    if (updates.signedAt !== undefined) dbUpdates.signed_at = updates.signedAt;

    const { error } = await supabase
      .from('term_sheets')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating term sheet:', error);
      toast({ title: 'Error', description: 'Failed to update term sheet', variant: 'destructive' });
      return false;
    }

    setTermSheets(prev => prev.map(ts => ts.id === id ? { ...ts, ...updates } : ts));
    return true;
  };

  const sendTermSheet = async (id: string): Promise<boolean> => {
    const termSheet = termSheets.find(ts => ts.id === id);
    if (!termSheet) return false;

    try {
      const { data, error } = await supabase.functions.invoke('send-term-sheet', {
        body: { termSheetId: id },
      });

      if (error) throw error;

      await updateTermSheet(id, { 
        status: 'sent', 
        sentAt: new Date().toISOString() 
      });
      
      toast({ title: 'Success', description: 'Term sheet sent successfully' });
      return true;
    } catch (error) {
      console.error('Error sending term sheet:', error);
      toast({ title: 'Error', description: 'Failed to send term sheet', variant: 'destructive' });
      return false;
    }
  };

  const markAsSigned = async (id: string): Promise<boolean> => {
    return updateTermSheet(id, { 
      status: 'signed', 
      signedAt: new Date().toISOString() 
    });
  };

  const deleteTermSheet = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('term_sheets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting term sheet:', error);
      toast({ title: 'Error', description: 'Failed to delete term sheet', variant: 'destructive' });
      return false;
    }

    setTermSheets(prev => prev.filter(ts => ts.id !== id));
    toast({ title: 'Deleted', description: 'Term sheet removed' });
    return true;
  };

  return {
    termSheets,
    isLoading,
    refetch: fetchTermSheets,
    getTermSheetByDealId,
    createTermSheet,
    updateTermSheet,
    sendTermSheet,
    markAsSigned,
    deleteTermSheet,
  };
}
