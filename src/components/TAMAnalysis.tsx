import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Deal, TAMAnalysis as TAMAnalysisType } from '@/types';

interface TAMAnalysisProps {
  deal: Deal;
  tamAnalysis?: TAMAnalysisType;
  onUpdate: (analysis: TAMAnalysisType) => void;
}

export function TAMAnalysis({ deal, tamAnalysis, onUpdate }: TAMAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const analyzeTAM = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-tam', {
        body: {
          dealName: deal.name,
          sector: deal.sector,
          geography: deal.geography,
          description: deal.description,
          claimedTAM: deal.ddReport?.pitchSanityCheck?.claimedTAM,
          scrapedContent: deal.ddReport?.scrapedContent,
        },
      });

      if (error) throw error;
      if (data.tamAnalysis) {
        onUpdate(data.tamAnalysis);
        toast({ title: 'TAM Analysis Complete' });
      }
    } catch (error) {
      console.error('TAM analysis error:', error);
      toast({ title: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'questionable': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inflated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4" />;
      case 'questionable': return <AlertTriangle className="w-4 h-4" />;
      case 'inflated': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!tamAnalysis) {
    return (
      <Card className="border-border/50">
        <CardContent className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">TAM Analysis</h3>
          <p className="text-muted-foreground mb-6">Analyze Total Addressable Market with top-down & bottom-up approaches</p>
          <Button onClick={analyzeTAM} disabled={isLoading} className="gradient-primary text-primary-foreground">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><TrendingUp className="w-4 h-4 mr-2" />Analyze TAM</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { topDown, bottomUp, validation } = tamAnalysis;

  return (
    <div className="space-y-6">
      {/* TAM Funnel Visualization */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl gradient-text flex items-center gap-2">
            <Target className="w-5 h-5" />
            Market Size Analysis
          </CardTitle>
          <Badge className={getStatusColor(validation.status)}>
            {getStatusIcon(validation.status)}
            <span className="ml-1 capitalize">{validation.status}</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* TAM Funnel */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top-Down Analysis</h4>
              <div className="relative">
                {/* TAM */}
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">TAM (Total)</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(topDown.tam)}</span>
                  </div>
                </div>
                {/* SAM */}
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-4 mb-2 ml-4 mr-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">SAM (Serviceable)</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(topDown.sam)}</span>
                  </div>
                </div>
                {/* SOM */}
                <div className="bg-primary/30 border border-primary/50 rounded-lg p-4 ml-8 mr-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">SOM (Obtainable)</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(topDown.som)}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">CAGR:</span> {topDown.cagr}%
              </div>
            </div>

            {/* Bottom-Up */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bottom-Up Validation</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Target Customers</p>
                  <p className="text-xl font-bold text-foreground">{bottomUp.targetCustomers.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Avg Rev/Customer</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(bottomUp.avgRevenuePerCustomer)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Calculated TAM</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(bottomUp.calculatedTAM)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Penetration Rate</p>
                  <p className="text-xl font-bold text-foreground">{bottomUp.penetrationRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Card */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Validation Analysis
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">{validation.claimedVsCalculated}</p>
          <p className="text-muted-foreground">{validation.reasoning}</p>
          
          {validation.redFlags.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Red Flags
              </h5>
              <ul className="space-y-1">
                {validation.redFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDetails && (
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Top-Down Methodology</h5>
                <p className="text-sm text-foreground">{topDown.methodology}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Bottom-Up Methodology</h5>
                <p className="text-sm text-foreground">{bottomUp.methodology}</p>
              </div>
              {topDown.sources.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Sources</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {topDown.sources.map((source, i) => (
                      <li key={i}>• {source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={analyzeTAM} disabled={isLoading} variant="outline">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Re-analyzing...</> : 'Re-analyze TAM'}
        </Button>
      </div>
    </div>
  );
}
