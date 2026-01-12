import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { BulkUploadZone } from '@/components/BulkUploadZone';
import { BulkProcessingStatus } from '@/components/BulkProcessingStatus';
import { TopStartupsCard } from '@/components/TopStartupsCard';
import { BulkComparisonTable } from '@/components/BulkComparisonTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkDDSession, BulkStartupEntry, BulkRanking, Deal, DDReport } from '@/types';
import { FileStack, RotateCcw, Lightbulb, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UploadedItem {
  id: string;
  name: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
}

export default function BulkDueDiligence() {
  const [session, setSession] = useState<BulkDDSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const parseAndAnalyze = useCallback(async (
    entry: BulkStartupEntry,
    updateEntry: (updates: Partial<BulkStartupEntry>) => void
  ): Promise<DDReport | null> => {
    const normalizePitchSanityCheck = (input: any) => {
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
    };

    const normalizeCompetitorMapping = (input: any) => {
      if (!Array.isArray(input)) return undefined;
      return input.map((c: any) => ({
        name: c?.name ?? '',
        description: c?.description ?? '',
        country: c?.country ?? '',
        fundingStage: c?.fundingStage ?? c?.funding_stage ?? '',
        websiteUrl: c?.websiteUrl ?? c?.website_url ?? undefined,
        comparison: c?.comparison ?? '',
      }));
    };

    const normalizeInvestmentSuccessRate = (input: any) => {
      if (!input) return undefined;
      return {
        probability: input.probability ?? 0,
        confidence: input.confidence ?? 'medium',
        reasoning: input.reasoning ?? '',
        keyRisks: input.keyRisks ?? input.key_risks ?? [],
        keyStrengths: input.keyStrengths ?? input.key_strengths ?? [],
      };
    };

    try {
      updateEntry({ status: 'parsing', progress: 20 });

      let pitchDeckContent = '';
      let scrapedContent = '';
      let dealUrl = '';

      if (entry.sourceType === 'url' && entry.sourceUrl) {
        dealUrl = entry.sourceUrl;

        // If it's a normal website URL (not a PDF), scrape it instead of "parsing a pitch deck".
        const isPdfUrl = /\.pdf(\?|#|$)/i.test(entry.sourceUrl);

        if (!isPdfUrl) {
          const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
            body: { url: entry.sourceUrl },
          });

          if (!scrapeError) {
            scrapedContent = scrapeData?.markdown || '';
          }
        } else {
          // Best-effort: try pitch deck parsing, but don't fail the whole run if it errors.
          try {
            const { data, error } = await supabase.functions.invoke('parse-pitch-deck', {
              body: { url: entry.sourceUrl },
            });

            if (!error) pitchDeckContent = data?.content || '';
          } catch {
            // ignore
          }
        }
      } else if (entry.sourceType === 'file') {
        // File parsing isn't wired yet; still allow DD generation using the filename.
        pitchDeckContent = `Pitch deck filename: ${entry.fileName || entry.name}`;
      }

      updateEntry({ status: 'analyzing', progress: 50, pitchDeckContent });

      const { data: ddData, error: ddError } = await supabase.functions.invoke('generate-dd', {
        body: {
          dealName: entry.name,
          dealUrl,
          dealDescription: `Startup: ${entry.name}`,
          scrapedContent,
          pitchDeckContent,
        },
      });

      if (ddError) throw new Error(ddError.message);

      const raw = (ddData || {}) as any;
      const scores = raw.scores || {
        team: { score: raw.team_score ?? 3, reason: raw.team_reason ?? '' },
        market: { score: raw.market_score ?? 3, reason: raw.market_reason ?? '' },
        product: { score: raw.product_score ?? 3, reason: raw.product_reason ?? '' },
        moat: { score: raw.moat_score ?? 3, reason: raw.moat_reason ?? '' },
      };

      const ddReport: DDReport = {
        id: crypto.randomUUID(),
        dealId: entry.id,
        summary: raw.summary || '',
        scores,
        followUpQuestions: raw.followUpQuestions || raw.follow_up_questions || [],
        generatedAt: new Date().toISOString(),
        scrapedContent: scrapedContent || undefined,
        pitchSanityCheck: normalizePitchSanityCheck(raw.pitchSanityCheck || raw.pitch_sanity_check),
        swotAnalysis: raw.swotAnalysis || raw.swot_analysis,
        moatAssessment: raw.moatAssessment || raw.moat_assessment,
        competitorMapping: normalizeCompetitorMapping(raw.competitorMapping || raw.competitor_mapping),
        investmentSuccessRate: normalizeInvestmentSuccessRate(raw.investmentSuccessRate || raw.investment_success_rate),
        financialAnalysis: raw.financialAnalysis,
      };

      updateEntry({ status: 'complete', progress: 100, ddReport });
      return ddReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      updateEntry({ status: 'error', error: errorMessage, progress: 0 });
      return null;
    }
  }, []);

  const rankStartups = useCallback(async (startups: BulkStartupEntry[]): Promise<BulkRanking | null> => {
    const completedStartups = startups.filter(s => s.status === 'complete' && s.ddReport);
    
    if (completedStartups.length < 2) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('rank-startups', {
        body: {
          startups: completedStartups.map(s => ({
            id: s.id,
            name: s.name,
            ddReport: s.ddReport
          }))
        }
      });

      if (error) throw error;
      return data as BulkRanking;

    } catch (error) {
      console.error('Ranking error:', error);
      toast({
        title: "Ranking failed",
        description: "Could not generate rankings. Using score-based ranking instead.",
        variant: "destructive"
      });

      // Fallback: simple score-based ranking
      const ranked = completedStartups
        .map(s => ({
          startupId: s.id,
          name: s.name,
          score: (
            (s.ddReport?.scores.team.score || 0) +
            (s.ddReport?.scores.market.score || 0) +
            (s.ddReport?.scores.product.score || 0) +
            (s.ddReport?.scores.moat.score || 0)
          ) * 5,
          breakdown: {
            team: s.ddReport?.scores.team.score || 0,
            market: s.ddReport?.scores.market.score || 0,
            product: s.ddReport?.scores.product.score || 0,
            moat: s.ddReport?.scores.moat.score || 0,
            financials: 3
          }
        }))
        .sort((a, b) => b.score - a.score)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));

      return {
        top3: ranked.slice(0, 3).map((r, idx) => ({
          rank: (idx + 1) as 1 | 2 | 3,
          startupId: r.startupId,
          name: r.name,
          overallScore: r.score,
          reasoning: `Ranked #${idx + 1} based on overall DD scores`,
          keyStrengths: ['Strong overall metrics'],
          keyRisks: ['Further analysis recommended']
        })),
        allRankings: ranked,
        comparisonInsights: 'Rankings based on aggregate DD scores',
        investmentThesis: 'Top performers show strong fundamentals across key metrics'
      };
    }
  }, [toast]);

  const handleUpload = useCallback(async (items: UploadedItem[]) => {
    setIsProcessing(true);

    const startups: BulkStartupEntry[] = items.map(item => ({
      id: item.id,
      name: item.name,
      sourceType: item.type,
      sourceUrl: item.url,
      fileName: item.file?.name,
      status: 'pending',
      progress: 0
    }));

    const newSession: BulkDDSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'processing',
      startups
    };

    setSession(newSession);

    // Process startups in parallel (max 3 at a time)
    const BATCH_SIZE = 3;
    const results: (DDReport | null)[] = [];

    for (let i = 0; i < startups.length; i += BATCH_SIZE) {
      const batch = startups.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(entry => {
        const updateEntry = (updates: Partial<BulkStartupEntry>) => {
          setSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              startups: prev.startups.map(s => 
                s.id === entry.id ? { ...s, ...updates } : s
              )
            };
          });
        };

        return parseAndAnalyze(entry, updateEntry);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Rank startups
    setSession(prev => prev ? { ...prev, status: 'ranking' } : prev);

    const ranking = await rankStartups(
      startups.map((s, idx) => ({
        ...s,
        status: results[idx] ? 'complete' : 'error',
        ddReport: results[idx] || undefined
      }))
    );

    setSession(prev => prev ? { 
      ...prev, 
      status: 'complete',
      ranking: ranking || undefined,
      startups: prev.startups.map((s, idx) => ({
        ...s,
        ddReport: results[idx] || undefined
      }))
    } : prev);

    setIsProcessing(false);

    toast({
      title: "Analysis Complete",
      description: `Analyzed ${results.filter(r => r !== null).length} of ${startups.length} startups`
    });
  }, [parseAndAnalyze, rankStartups, toast]);

  const handleViewDeal = (startupId: string) => {
    const startup = session?.startups.find(s => s.id === startupId);
    if (startup?.ddReport) {
      // Save to localStorage and navigate
      const deal: Deal = {
        id: startupId,
        userId: 'bulk-dd',
        name: startup.name,
        createdAt: new Date().toISOString(),
        ddReport: startup.ddReport
      };

      const existingDeals = JSON.parse(localStorage.getItem('vc-deals') || '[]');
      const exists = existingDeals.find((d: Deal) => d.id === startupId);
      if (!exists) {
        existingDeals.push(deal);
        localStorage.setItem('vc-deals', JSON.stringify(existingDeals));
      }

      navigate(`/deal/${startupId}`);
    }
  };

  const handleReset = () => {
    setSession(null);
    setIsProcessing(false);
  };

  const overallProgress = session 
    ? session.startups.reduce((sum, s) => sum + s.progress, 0) / session.startups.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <FileStack className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bulk Due Diligence</h1>
              <p className="text-muted-foreground">
                Analyze up to 10 startups at once and get AI-powered recommendations
              </p>
            </div>
          </div>
        </div>

        {/* No Session - Show Upload */}
        {!session && (
          <div className="space-y-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">How it works</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 10 pitch decks → AI analyzes each startup → Get ranked recommendations with the top 3 investment opportunities
                  </p>
                </div>
              </CardContent>
            </Card>

            <BulkUploadZone 
              onUpload={handleUpload}
              maxItems={10}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Processing */}
        {session && session.status === 'processing' && (
          <BulkProcessingStatus 
            startups={session.startups}
            overallProgress={overallProgress}
          />
        )}

        {/* Ranking in Progress */}
        {session && session.status === 'ranking' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI is Ranking Startups</h3>
              <p className="text-muted-foreground">
                Comparing all analyzed startups to find the top recommendations...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {session && session.status === 'complete' && session.ranking && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Analysis
              </Button>
            </div>

            {/* Top 3 */}
            <TopStartupsCard 
              rankings={session.ranking.top3}
              onViewDeal={handleViewDeal}
            />

            {/* Investment Thesis */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Investment Thesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {session.ranking.investmentThesis}
                </p>
                {session.ranking.comparisonInsights && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.ranking.comparisonInsights}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Full Comparison Table */}
            <BulkComparisonTable 
              rankings={session.ranking.allRankings}
              startups={session.startups}
              onViewDeal={handleViewDeal}
            />
          </div>
        )}
      </main>
    </div>
  );
}
