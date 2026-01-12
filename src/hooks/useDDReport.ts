import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DDReport, ScoreItem, PitchSanityCheck, SWOTAnalysis, MoatAssessment, Competitor, InvestmentSuccessRate } from '@/types';

interface DDReportRow {
  id: string;
  deal_id: string;
  summary: string | null;
  team_score: number | null;
  team_reason: string | null;
  market_score: number | null;
  market_reason: string | null;
  product_score: number | null;
  product_reason: string | null;
  moat_score: number | null;
  moat_reason: string | null;
  follow_up_questions: string[] | null;
  scraped_content: string | null;
  pitch_sanity_check: PitchSanityCheck | null;
  swot_analysis: SWOTAnalysis | null;
  moat_assessment: MoatAssessment | null;
  competitor_mapping: Competitor[] | null;
  investment_success_rate: InvestmentSuccessRate | null;
  created_at: string;
}

function normalizePitchSanityCheck(input: any): PitchSanityCheck | undefined {
  if (!input) return undefined;
  return {
    status: input.status,
    problem: input.problem ?? '',
    solution: input.solution ?? '',
    targetCustomer: input.targetCustomer ?? input.target_customer ?? '',
    pricingModel: input.pricingModel ?? input.pricing_model ?? '',
    keyMetrics: input.keyMetrics ?? input.key_metrics ?? [],
    claimedTAM: input.claimedTAM ?? input.claimed_tam ?? '',
    missingInfo: input.missingInfo ?? input.missing_info ?? [],
  };
}

function normalizeCompetitorMapping(input: any): Competitor[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return input.map((c: any) => ({
    name: c?.name ?? '',
    description: c?.description ?? '',
    country: c?.country ?? '',
    fundingStage: c?.fundingStage ?? c?.funding_stage ?? '',
    websiteUrl: c?.websiteUrl ?? c?.website_url ?? undefined,
    comparison: c?.comparison ?? '',
  }));
}

function normalizeInvestmentSuccessRate(input: any): InvestmentSuccessRate | undefined {
  if (!input) return undefined;
  return {
    probability: input.probability ?? 0,
    confidence: input.confidence ?? 'medium',
    reasoning: input.reasoning ?? '',
    keyRisks: input.keyRisks ?? input.key_risks ?? [],
    keyStrengths: input.keyStrengths ?? input.key_strengths ?? [],
  };
}

function mapRowToDDReport(row: DDReportRow): DDReport {
  const scores = {
    team: { score: row.team_score || 0, reason: row.team_reason || '' } as ScoreItem,
    market: { score: row.market_score || 0, reason: row.market_reason || '' } as ScoreItem,
    product: { score: row.product_score || 0, reason: row.product_reason || '' } as ScoreItem,
    moat: { score: row.moat_score || 0, reason: row.moat_reason || '' } as ScoreItem,
  };

  return {
    id: row.id,
    dealId: row.deal_id,
    summary: row.summary || '',
    scores,
    followUpQuestions: row.follow_up_questions || [],
    generatedAt: row.created_at,
    scrapedContent: row.scraped_content || undefined,
    pitchSanityCheck: normalizePitchSanityCheck(row.pitch_sanity_check),
    swotAnalysis: (row.swot_analysis as any) || undefined,
    moatAssessment: (row.moat_assessment as any) || undefined,
    competitorMapping: normalizeCompetitorMapping(row.competitor_mapping),
    investmentSuccessRate: normalizeInvestmentSuccessRate(row.investment_success_rate),
  };
}

export function useDDReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDDReport = useCallback(async (reportId: string): Promise<DDReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('dd_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        return null;
      }

      return mapRowToDDReport(data as unknown as DDReportRow);
    } catch (err: any) {
      console.error('Error fetching DD report:', err);
      setError(err.message || 'Failed to fetch DD report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDDReportByDealId = useCallback(async (dealId: string): Promise<DDReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('dd_reports')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw fetchError;
      }

      return mapRowToDDReport(data as unknown as DDReportRow);
    } catch (err: any) {
      console.error('Error fetching DD report by deal ID:', err);
      setError(err.message || 'Failed to fetch DD report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getDDReport,
    getDDReportByDealId,
    isLoading,
    error,
  };
}
