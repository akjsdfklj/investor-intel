import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Deal, KeywordIntelligence as KeywordIntelligenceType } from '@/types';

interface KeywordIntelligenceProps {
  deal: Deal;
  keywordIntelligence?: KeywordIntelligenceType;
  onUpdate: (intelligence: KeywordIntelligenceType) => void;
}

export function KeywordIntelligence({ deal, keywordIntelligence, onUpdate }: KeywordIntelligenceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzeKeywords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('keyword-intelligence', {
        body: {
          dealName: deal.name,
          sector: deal.sector,
          websiteUrl: deal.url,
          description: deal.description,
          competitors: deal.ddReport?.competitorMapping,
        },
      });

      if (error) throw error;
      if (data.keywordIntelligence) {
        onUpdate(data.keywordIntelligence);
        toast({ title: 'Keyword Analysis Complete' });
      }
    } catch (error) {
      console.error('Keyword analysis error:', error);
      toast({ title: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case 'declining': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-emerald-400';
    if (difficulty < 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getPotentialBadge = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!keywordIntelligence) {
    return (
      <Card className="border-border/50">
        <CardContent className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keyword Intelligence</h3>
          <p className="text-muted-foreground mb-6">Analyze SEO keywords, competitor overlap, and market opportunities</p>
          <Button onClick={analyzeKeywords} disabled={isLoading} className="gradient-primary text-primary-foreground">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Search className="w-4 h-4 mr-2" />Analyze Keywords</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { primaryKeywords, competitorKeywords, opportunityGaps, seoScore, recommendations } = keywordIntelligence;

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-xl gradient-text flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{seoScore}</div>
            <div className="flex-1">
              <Progress value={seoScore} className="h-3" />
            </div>
            <div className="text-sm text-muted-foreground">/100</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Keywords */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Primary Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {primaryKeywords.map((kw, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{kw.keyword}</span>
                      {getTrendIcon(kw.trend)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>Vol: {kw.searchVolume.toLocaleString()}</span>
                      <span className={getDifficultyColor(kw.difficulty)}>Diff: {kw.difficulty}</span>
                      <span>CPC: ${kw.cpc.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitor Keywords */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Competitor Keyword Overlap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {competitorKeywords.map((kw, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{kw.keyword}</span>
                    <span className="text-sm text-muted-foreground">{kw.overlap}% overlap</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kw.competitors.map((comp, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Gaps */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Keyword Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunityGaps.map((gap, i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{gap.keyword}</span>
                  <Badge className={getPotentialBadge(gap.potential)}>
                    {gap.potential}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{gap.reasoning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">SEO Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={analyzeKeywords} disabled={isLoading} variant="outline">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh Analysis'}
        </Button>
      </div>
    </div>
  );
}
