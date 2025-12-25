import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Users, ChevronDown, ExternalLink, TrendingUp, AlertTriangle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Deal, DetailedCompetitor } from '@/types';

interface DetailedCompetitorTableProps {
  deal: Deal;
  competitors?: DetailedCompetitor[];
  onUpdate: (competitors: DetailedCompetitor[]) => void;
}

export function DetailedCompetitorTable({ deal, competitors, onUpdate }: DetailedCompetitorTableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const analyzeCompetitors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          dealName: deal.name,
          sector: deal.sector,
          geography: deal.geography,
          description: deal.description,
          existingCompetitors: deal.ddReport?.competitorMapping,
        },
      });

      if (error) throw error;
      if (data.detailedCompetitors) {
        onUpdate(data.detailedCompetitors);
        toast({ title: 'Competitor Analysis Complete' });
      }
    } catch (error) {
      console.error('Competitor analysis error:', error);
      toast({ title: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (name: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-primary/20 text-primary border-primary/30';
      case 'challenger': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'niche': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'emerging': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!competitors || competitors.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Detailed Competitor Analysis</h3>
          <p className="text-muted-foreground mb-6">Deep dive into competitors with funding details, investors, and KPIs</p>
          <Button onClick={analyzeCompetitors} disabled={isLoading} className="gradient-primary text-primary-foreground">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Users className="w-4 h-4 mr-2" />Analyze Competitors</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold gradient-text flex items-center gap-2">
          <Users className="w-5 h-5" />
          Competitive Landscape ({competitors.length})
        </h3>
        <Button onClick={analyzeCompetitors} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-3">
        {competitors.map((comp) => (
          <Card key={comp.name} className="border-border/50">
            <Collapsible open={expandedRows.has(comp.name)} onOpenChange={() => toggleRow(comp.name)}>
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{comp.name}</h4>
                        <Badge className={getThreatBadge(comp.comparison.threatLevel)}>
                          {comp.comparison.threatLevel} threat
                        </Badge>
                        <Badge className={getPositionBadge(comp.comparison.marketPosition)}>
                          {comp.comparison.marketPosition}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{comp.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {comp.headquarters}
                        </span>
                        <span>Founded: {comp.founded}</span>
                        <span>{comp.employeeCount.toLocaleString()} employees</span>
                        <span className="text-primary font-medium">
                          Raised: {formatCurrency(comp.funding.totalRaised)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedRows.has(comp.name) ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                  {/* Funding Details */}
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Funding History</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Total Raised</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(comp.funding.totalRaised)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Last Round</p>
                        <p className="text-lg font-bold text-foreground">{comp.funding.lastRound}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(comp.funding.lastRoundAmount)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Last Round Date</p>
                        <p className="text-lg font-bold text-foreground">{comp.funding.lastRoundDate}</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Valuation</p>
                        <p className="text-lg font-bold text-foreground">{comp.funding.valuation ? formatCurrency(comp.funding.valuation) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Investors */}
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Key Investors</h5>
                    <div className="flex flex-wrap gap-2">
                      {comp.investors.map((inv, i) => (
                        <Badge key={i} variant="outline" className={inv.leadInvestor ? 'border-primary text-primary' : ''}>
                          {inv.name}
                          <span className="ml-1 text-xs opacity-60">({inv.type})</span>
                          {inv.leadInvestor && <span className="ml-1">★</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Estimated KPIs */}
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Estimated Metrics</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Est. Revenue</p>
                        <p className="font-semibold text-foreground">{formatCurrency(comp.kpis.estimatedRevenue)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Est. Customers</p>
                        <p className="font-semibold text-foreground">{comp.kpis.estimatedCustomers?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Est. ARPU</p>
                        <p className="font-semibold text-foreground">{formatCurrency(comp.kpis.estimatedArpu)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Growth Rate</p>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          {comp.kpis.growthRate !== null ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              {comp.kpis.growthRate}%
                            </>
                          ) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Their Strengths vs You
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {comp.comparison.strengthsVsStartup.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Their Weaknesses vs You
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {comp.comparison.weaknessesVsStartup.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {comp.websiteUrl && (
                    <div className="pt-2">
                      <a
                        href={comp.websiteUrl.startsWith('http') ? comp.websiteUrl : `https://${comp.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
