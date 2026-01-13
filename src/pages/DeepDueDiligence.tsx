import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, Globe, TrendingUp, Users, Shield, Target, DollarSign, BarChart3, Zap, AlertTriangle, CheckCircle, XCircle, Building2, Briefcase, ArrowUpRight, ArrowDownRight, Minus} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeepDDResult {
  companyName: string;
  websiteUrl: string;
  generatedAt: string;
  
  // Executive Summary
  executiveSummary: {
    verdict: 'strong_pass' | 'pass' | 'conditional' | 'pass_with_concerns' | 'fail';
    oneLiner: string;
    keyHighlights: string[];
    criticalRisks: string[];
    investmentScore: number;
  };
  
  // TAM Analysis
  tamAnalysis: {
    globalMarket: number;
    tam: number;
    sam: number;
    som: number;
    cagr: number;
    methodology: string;
    validation: 'validated' | 'questionable' | 'inflated';
    sources: string[];
  };
  
  // Founder/Team SWOT
  founderSwot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    overallScore: number;
    founders: {
      name: string;
      role: string;
      background: string;
      previousExits: number;
      domainExpertise: 'high' | 'medium' | 'low';
    }[];
  };
  
  // Product SWOT
  productSwot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    productMarketFit: 'strong' | 'moderate' | 'weak' | 'unknown';
    techStack: string[];
    scalability: 'high' | 'medium' | 'low';
  };
  
  // Moat Analysis
  moatAnalysis: {
    overallScore: number;
    moatTypes: {
      type: string;
      strength: 'strong' | 'moderate' | 'weak' | 'none';
      reasoning: string;
    }[];
    sustainability: string;
    timeToReplicate: string;
  };
  
  // Competitor Analysis
  competitorAnalysis: {
    directCompetitors: {
      name: string;
      description: string;
      country: string;
      fundingStage: string;
      totalFunding: number;
      lastRoundAmount: number;
      lastRoundDate: string;
      valuation: number | null;
      investors: string[];
      strengths: string[];
      weaknesses: string[];
      marketPosition: 'leader' | 'challenger' | 'niche' | 'emerging';
    }[];
    indirectCompetitors: string[];
    competitiveAdvantage: string;
    marketShare: string;
  };
  
  // Unit Economics
  unitEconomics: {
    ltv: number | null;
    cac: number | null;
    ltvCacRatio: number | null;
    grossMargin: number | null;
    paybackPeriod: number | null;
    churnRate: number | null;
    arpu: number | null;
    assessment: 'excellent' | 'good' | 'average' | 'poor' | 'unknown';
    insights: string[];
  };
  
  // Funding Intelligence
  fundingIntelligence: {
    currentStage: string;
    totalRaised: number | null;
    lastRound: {
      type: string;
      amount: number | null;
      date: string;
      valuation: number | null;
      leadInvestors: string[];
    } | null;
    burnRate: number | null;
    runway: number | null;
    fundingHistory: {
      round: string;
      amount: number;
      date: string;
      investors: string[];
    }[];
  };
  
  // Risk Assessment
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    categories: {
      category: string;
      level: 'low' | 'medium' | 'high';
      factors: string[];
    }[];
    mitigationStrategies: string[];
  };
  
  // Investment Thesis
  investmentThesis: {
    recommendation: 'strong_invest' | 'invest' | 'conditional' | 'pass' | 'strong_pass';
    reasoning: string;
    keyMetrics: { metric: string; value: string; benchmark: string; status: 'above' | 'at' | 'below' }[];
    nextSteps: string[];
  };
}

export default function DeepDueDiligence() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<DeepDDResult | null>(null);

  const runDeepDD = useCallback(async () => {
    if (!companyName.trim()) {
      toast({ title: 'Error', description: 'Please enter a company name', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      // Step 1: Scrape website if provided
      setProgressMessage('Scraping website content...');
      setProgress(10);
      
      let scrapedContent = '';
      if (websiteUrl.trim()) {
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
          body: { url: websiteUrl.trim() },
        });
        
        if (!scrapeError && scrapeData?.markdown) {
          scrapedContent = scrapeData.markdown;
        }
      }

      setProgressMessage('Generating comprehensive due diligence...');
      setProgress(30);

      // Step 2: Call deep DD edge function
      const { data, error } = await supabase.functions.invoke('deep-due-diligence', {
        body: {
          companyName: companyName.trim(),
          websiteUrl: websiteUrl.trim(),
          scrapedContent,
          additionalContext: additionalContext.trim(),
        },
      });

      if (error) throw new Error(error.message);

      setProgress(100);
      setProgressMessage('Analysis complete!');
      setResult(data);
      
      toast({ title: 'Deep DD Complete', description: `Comprehensive analysis generated for ${companyName}` });
    } catch (error) {
      console.error('Deep DD error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to generate analysis',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [companyName, websiteUrl, additionalContext, toast]);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'strong_pass': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'pass': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'conditional': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'pass_with_concerns': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'fail': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Deep Due Diligence</h1>
            <p className="text-muted-foreground">
              Comprehensive AI-powered analysis including TAM, SWOT, moat, competitors, unit economics, and more
            </p>
          </div>

          {/* Input Form */}
          {!result && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Analyze a Company
                </CardTitle>
                <CardDescription>
                  Enter company details for comprehensive due diligence analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <Input
                      placeholder="e.g., Stripe, Notion, Figma"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website URL</label>
                    <Input
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Context (Optional)</label>
                  <Textarea
                    placeholder="Any additional information: pitch deck notes, founder backgrounds, known metrics, sector focus..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    disabled={isAnalyzing}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={runDeepDD}
                  disabled={isAnalyzing || !companyName.trim()}
                  className="w-full gradient-primary text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run Deep Due Diligence
                    </>
                  )}
                </Button>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">{progressMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{result.companyName}</h2>
                  {result.websiteUrl && (
                    <a href={result.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {result.websiteUrl}
                    </a>
                  )}
                </div>
                <Button variant="outline" onClick={() => setResult(null)}>
                  New Analysis
                </Button>
              </div>

              {/* Executive Summary Card */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Executive Summary
                    </CardTitle>
                    <Badge className={getVerdictColor(result.executiveSummary.verdict)}>
                      {result.executiveSummary.verdict.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg font-medium">{result.executiveSummary.oneLiner}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold gradient-text">{result.executiveSummary.investmentScore}</div>
                      <div className="text-xs text-muted-foreground">Investment Score</div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Key Highlights
                        </h4>
                        <ul className="text-sm space-y-1">
                          {result.executiveSummary.keyHighlights.map((h, i) => (
                            <li key={i} className="text-muted-foreground">• {h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Critical Risks
                        </h4>
                        <ul className="text-sm space-y-1">
                          {result.executiveSummary.criticalRisks.map((r, i) => (
                            <li key={i} className="text-muted-foreground">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Analysis Sections */}
              <Tabs defaultValue="tam" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
                  <TabsTrigger value="tam" className="text-xs">TAM</TabsTrigger>
                  <TabsTrigger value="founders" className="text-xs">Team</TabsTrigger>
                  <TabsTrigger value="product" className="text-xs">Product</TabsTrigger>
                  <TabsTrigger value="moat" className="text-xs">Moat</TabsTrigger>
                  <TabsTrigger value="competitors" className="text-xs">Competitors</TabsTrigger>
                  <TabsTrigger value="economics" className="text-xs">Unit Econ</TabsTrigger>
                  <TabsTrigger value="funding" className="text-xs">Funding</TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
                </TabsList>

                {/* TAM Analysis */}
                <TabsContent value="tam">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Total Addressable Market (TAM) Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.tamAnalysis.tam)}</div>
                          <div className="text-xs text-muted-foreground">TAM</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.tamAnalysis.sam)}</div>
                          <div className="text-xs text-muted-foreground">SAM</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.tamAnalysis.som)}</div>
                          <div className="text-xs text-muted-foreground">SOM</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{result.tamAnalysis.cagr}%</div>
                          <div className="text-xs text-muted-foreground">CAGR</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Validation:</span>
                        <Badge variant={result.tamAnalysis.validation === 'validated' ? 'default' : result.tamAnalysis.validation === 'questionable' ? 'secondary' : 'destructive'}>
                          {result.tamAnalysis.validation}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Methodology</h4>
                        <p className="text-sm text-muted-foreground">{result.tamAnalysis.methodology}</p>
                      </div>
                      
                      {result.tamAnalysis.sources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.tamAnalysis.sources.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Founders/Team SWOT */}
                <TabsContent value="founders">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Founder & Team Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Founder Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.founderSwot.founders.map((f, i) => (
                          <div key={i} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{f.name}</h4>
                                <p className="text-sm text-muted-foreground">{f.role}</p>
                              </div>
                              <Badge variant={f.domainExpertise === 'high' ? 'default' : f.domainExpertise === 'medium' ? 'secondary' : 'outline'}>
                                {f.domainExpertise} expertise
                              </Badge>
                            </div>
                            <p className="text-sm mt-2">{f.background}</p>
                            {f.previousExits > 0 && (
                              <p className="text-sm text-green-600 mt-1">✓ {f.previousExits} previous exit(s)</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* SWOT Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {result.founderSwot.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <h4 className="font-medium text-red-600 mb-2">Weaknesses</h4>
                          <ul className="text-sm space-y-1">
                            {result.founderSwot.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <h4 className="font-medium text-blue-600 mb-2">Opportunities</h4>
                          <ul className="text-sm space-y-1">
                            {result.founderSwot.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <h4 className="font-medium text-orange-600 mb-2">Threats</h4>
                          <ul className="text-sm space-y-1">
                            {result.founderSwot.threats.map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Product SWOT */}
                <TabsContent value="product">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Product Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Badge variant={result.productSwot.productMarketFit === 'strong' ? 'default' : 'secondary'}>
                          PMF: {result.productSwot.productMarketFit}
                        </Badge>
                        <Badge variant="outline">Scalability: {result.productSwot.scalability}</Badge>
                      </div>

                      {result.productSwot.techStack.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.productSwot.techStack.map((t, i) => (
                              <Badge key={i} variant="outline">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {result.productSwot.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <h4 className="font-medium text-red-600 mb-2">Weaknesses</h4>
                          <ul className="text-sm space-y-1">
                            {result.productSwot.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <h4 className="font-medium text-blue-600 mb-2">Opportunities</h4>
                          <ul className="text-sm space-y-1">
                            {result.productSwot.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <h4 className="font-medium text-orange-600 mb-2">Threats</h4>
                          <ul className="text-sm space-y-1">
                            {result.productSwot.threats.map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Moat Analysis */}
                <TabsContent value="moat">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Moat Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold gradient-text">{result.moatAnalysis.overallScore}/10</div>
                          <div className="text-xs text-muted-foreground">Overall Moat Score</div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm"><strong>Sustainability:</strong> {result.moatAnalysis.sustainability}</p>
                          <p className="text-sm"><strong>Time to Replicate:</strong> {result.moatAnalysis.timeToReplicate}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {result.moatAnalysis.moatTypes.map((m, i) => (
                          <div key={i} className="p-3 rounded-lg border flex items-center justify-between">
                            <div>
                              <span className="font-medium">{m.type}</span>
                              <p className="text-sm text-muted-foreground">{m.reasoning}</p>
                            </div>
                            <Badge variant={m.strength === 'strong' ? 'default' : m.strength === 'moderate' ? 'secondary' : 'outline'}>
                              {m.strength}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Competitor Analysis */}
                <TabsContent value="competitors">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Competitor Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-sm"><strong>Competitive Advantage:</strong> {result.competitorAnalysis.competitiveAdvantage}</p>
                      
                      <div className="space-y-4">
                        {result.competitorAnalysis.directCompetitors.map((c, i) => (
                          <div key={i} className="p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{c.name}</h4>
                                <p className="text-sm text-muted-foreground">{c.description}</p>
                              </div>
                              <Badge variant={c.marketPosition === 'leader' ? 'default' : 'secondary'}>
                                {c.marketPosition}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                              <div><span className="text-muted-foreground">Stage:</span> {c.fundingStage}</div>
                              <div><span className="text-muted-foreground">Total Raised:</span> {formatCurrency(c.totalFunding)}</div>
                              <div><span className="text-muted-foreground">Last Round:</span> {formatCurrency(c.lastRoundAmount)}</div>
                              <div><span className="text-muted-foreground">Valuation:</span> {formatCurrency(c.valuation)}</div>
                            </div>
                            
                            {c.investors.length > 0 && (
                              <div className="mb-3">
                                <span className="text-sm text-muted-foreground">Investors: </span>
                                <span className="text-sm">{c.investors.join(', ')}</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-green-600 font-medium">Strengths vs Us:</span>
                                <ul className="mt-1">
                                  {c.strengths.map((s, j) => <li key={j}>• {s}</li>)}
                                </ul>
                              </div>
                              <div>
                                <span className="text-red-600 font-medium">Weaknesses vs Us:</span>
                                <ul className="mt-1">
                                  {c.weaknesses.map((w, j) => <li key={j}>• {w}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Unit Economics */}
                <TabsContent value="economics">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Unit Economics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Badge variant={result.unitEconomics.assessment === 'excellent' || result.unitEconomics.assessment === 'good' ? 'default' : 'secondary'}>
                        Assessment: {result.unitEconomics.assessment}
                      </Badge>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.unitEconomics.ltv)}</div>
                          <div className="text-xs text-muted-foreground">LTV</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.unitEconomics.cac)}</div>
                          <div className="text-xs text-muted-foreground">CAC</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{result.unitEconomics.ltvCacRatio?.toFixed(1) || 'N/A'}x</div>
                          <div className="text-xs text-muted-foreground">LTV:CAC</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{result.unitEconomics.grossMargin != null ? `${result.unitEconomics.grossMargin}%` : 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Gross Margin</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{result.unitEconomics.paybackPeriod != null ? `${result.unitEconomics.paybackPeriod}mo` : 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Payback Period</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{result.unitEconomics.churnRate != null ? `${result.unitEconomics.churnRate}%` : 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Churn Rate</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(result.unitEconomics.arpu)}</div>
                          <div className="text-xs text-muted-foreground">ARPU</div>
                        </div>
                      </div>

                      {result.unitEconomics.insights.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Insights</h4>
                          <ul className="text-sm space-y-1">
                            {result.unitEconomics.insights.map((insight, i) => (
                              <li key={i} className="text-muted-foreground">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Funding Intelligence */}
                <TabsContent value="funding">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Funding Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold text-primary">{result.fundingIntelligence.currentStage}</div>
                          <div className="text-xs text-muted-foreground">Current Stage</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold text-primary">{formatCurrency(result.fundingIntelligence.totalRaised)}</div>
                          <div className="text-xs text-muted-foreground">Total Raised</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold text-primary">{formatCurrency(result.fundingIntelligence.burnRate)}/mo</div>
                          <div className="text-xs text-muted-foreground">Burn Rate</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold text-primary">{result.fundingIntelligence.runway != null ? `${result.fundingIntelligence.runway}mo` : 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Runway</div>
                        </div>
                      </div>

                      {result.fundingIntelligence.lastRound && (
                        <div className="p-4 rounded-lg border">
                          <h4 className="font-medium mb-2">Last Round</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Type:</span> {result.fundingIntelligence.lastRound.type}</div>
                            <div><span className="text-muted-foreground">Amount:</span> {formatCurrency(result.fundingIntelligence.lastRound.amount)}</div>
                            <div><span className="text-muted-foreground">Date:</span> {result.fundingIntelligence.lastRound.date}</div>
                            <div><span className="text-muted-foreground">Valuation:</span> {formatCurrency(result.fundingIntelligence.lastRound.valuation)}</div>
                          </div>
                          {result.fundingIntelligence.lastRound.leadInvestors.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Lead Investors:</span> {result.fundingIntelligence.lastRound.leadInvestors.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {result.fundingIntelligence.fundingHistory.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Funding History</h4>
                          <div className="space-y-2">
                            {result.fundingIntelligence.fundingHistory.map((round, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                <div>
                                  <span className="font-medium">{round.round}</span>
                                  <span className="text-sm text-muted-foreground ml-2">{round.date}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(round.amount)}</div>
                                  <div className="text-xs text-muted-foreground">{round.investors.slice(0, 2).join(', ')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Risk Assessment */}
                <TabsContent value="risk">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Badge className={getRiskColor(result.riskAssessment.overallRisk)}>
                        Overall Risk: {result.riskAssessment.overallRisk.toUpperCase()}
                      </Badge>

                      <div className="space-y-4">
                        {result.riskAssessment.categories.map((cat, i) => (
                          <div key={i} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{cat.category}</h4>
                              <Badge variant={cat.level === 'low' ? 'default' : cat.level === 'medium' ? 'secondary' : 'destructive'}>
                                {cat.level}
                              </Badge>
                            </div>
                            <ul className="text-sm space-y-1">
                              {cat.factors.map((f, j) => (
                                <li key={j} className="text-muted-foreground">• {f}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {result.riskAssessment.mitigationStrategies.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Mitigation Strategies</h4>
                          <ul className="text-sm space-y-1">
                            {result.riskAssessment.mitigationStrategies.map((s, i) => (
                              <li key={i} className="text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Investment Thesis */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Investment Thesis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={getVerdictColor(result.investmentThesis.recommendation)}>
                    {result.investmentThesis.recommendation.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  
                  <p className="text-muted-foreground">{result.investmentThesis.reasoning}</p>

                  {result.investmentThesis.keyMetrics.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Metrics vs Benchmark</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.investmentThesis.keyMetrics.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-sm">{m.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{m.value}</span>
                              <span className="text-xs text-muted-foreground">vs {m.benchmark}</span>
                              {m.status === 'above' && <ArrowUpRight className="w-4 h-4 text-green-600" />}
                              {m.status === 'at' && <Minus className="w-4 h-4 text-yellow-600" />}
                              {m.status === 'below' && <ArrowDownRight className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.investmentThesis.nextSteps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommended Next Steps</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {result.investmentThesis.nextSteps.map((step, i) => (
                          <li key={i} className="text-muted-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
