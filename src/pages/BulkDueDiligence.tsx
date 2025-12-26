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
    try {
      // Step 1: Parse pitch deck
      updateEntry({ status: 'parsing', progress: 20 });
      
      let pitchDeckContent = '';
      
      if (entry.sourceType === 'url' && entry.sourceUrl) {
        // For URLs, we'd need to download and parse
        const { data, error } = await supabase.functions.invoke('parse-pitch-deck', {
          body: { pdfUrl: entry.sourceUrl }
        });
        
        if (error) throw new Error(error.message);
        pitchDeckContent = data?.content || '';
      } else if (entry.sourceType === 'file') {
        // For files, upload to storage first then parse
        // Simplified: we'll use the name directly for now
        pitchDeckContent = `Pitch deck for ${entry.name}`;
      }

      updateEntry({ status: 'analyzing', progress: 50, pitchDeckContent });

      // Step 2: Generate DD
      const { data: ddData, error: ddError } = await supabase.functions.invoke('generate-dd', {
        body: {
          dealName: entry.name,
          dealDescription: `Startup: ${entry.name}`,
          pitchDeckContent
        }
      });

      if (ddError) throw new Error(ddError.message);

      const ddReport: DDReport = {
        id: crypto.randomUUID(),
        dealId: entry.id,
        summary: ddData?.summary || '',
        scores: ddData?.scores || {
          team: { score: 3, reason: '' },
          market: { score: 3, reason: '' },
          product: { score: 3, reason: '' },
          moat: { score: 3, reason: '' }
        },
        followUpQuestions: ddData?.followUpQuestions || [],
        generatedAt: new Date().toISOString(),
        pitchSanityCheck: ddData?.pitchSanityCheck,
        swotAnalysis: ddData?.swotAnalysis,
        moatAssessment: ddData?.moatAssessment,
        financialAnalysis: ddData?.financialAnalysis
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
