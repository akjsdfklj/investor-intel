import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Globe, TrendingUp, Users, Shield, Target, DollarSign, BarChart3, Zap, AlertTriangle, CheckCircle, XCircle, Building2, Briefcase, ArrowUpRight, ArrowDownRight, Minus, Download, Send, X, Mail } from 'lucide-react';
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
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newToEmail, setNewToEmail] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');

  const addToEmail = () => {
    const email = newToEmail.trim();
    if (email && !toEmails.includes(email) && email.includes('@')) {
      setToEmails([...toEmails, email]);
      setNewToEmail('');
    }
  };

  const removeToEmail = (email: string) => {
    setToEmails(toEmails.filter(e => e !== email));
  };

  const addCcEmail = () => {
    const email = newCcEmail.trim();
    if (email && !ccEmails.includes(email) && email.includes('@')) {
      setCcEmails([...ccEmails, email]);
      setNewCcEmail('');
    }
  };

  const removeCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email));
  };

  const generateReportHtml = useCallback(() => {
    if (!result) return '';
    
    return `
      <div class="section">
        <h2>Executive Summary</h2>
        <p><strong>Verdict:</strong> ${result.executiveSummary.verdict.replace(/_/g, ' ').toUpperCase()}</p>
        <p>${result.executiveSummary.oneLiner}</p>
        <p><strong>Investment Score:</strong> ${result.executiveSummary.investmentScore}/100</p>
        <h4>Key Highlights</h4>
        <ul>${result.executiveSummary.keyHighlights.map(h => `<li>${h}</li>`).join('')}</ul>
        <h4>Critical Risks</h4>
        <ul>${result.executiveSummary.criticalRisks.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
      
      <div class="section">
        <h2>TAM Analysis</h2>
        <p><strong>TAM:</strong> ${formatCurrency(result.tamAnalysis.tam)} | <strong>SAM:</strong> ${formatCurrency(result.tamAnalysis.sam)} | <strong>SOM:</strong> ${formatCurrency(result.tamAnalysis.som)}</p>
        <p><strong>CAGR:</strong> ${result.tamAnalysis.cagr}%</p>
        <p><strong>Validation:</strong> ${result.tamAnalysis.validation}</p>
      </div>
      
      <div class="section">
        <h2>Moat Analysis</h2>
        <p><strong>Overall Score:</strong> ${result.moatAnalysis.overallScore}/10</p>
        <p><strong>Time to Replicate:</strong> ${result.moatAnalysis.timeToReplicate}</p>
        <p>${result.moatAnalysis.sustainability}</p>
      </div>
      
      <div class="section">
        <h2>Risk Assessment</h2>
        <p><strong>Overall Risk:</strong> ${result.riskAssessment.overallRisk.toUpperCase()}</p>
        ${result.riskAssessment.categories.map(cat => `
          <h4>${cat.category} (${cat.level})</h4>
          <ul>${cat.factors.map(f => `<li>${f}</li>`).join('')}</ul>
        `).join('')}
      </div>
      
      <div class="section">
        <h2>Investment Thesis</h2>
        <p><strong>Recommendation:</strong> ${result.investmentThesis.recommendation.replace(/_/g, ' ').toUpperCase()}</p>
        <p>${result.investmentThesis.reasoning}</p>
      </div>
    `;
  }, [result]);

  const sendEmail = useCallback(async () => {
    if (!result || toEmails.length === 0) return;
    
    setIsSendingEmail(true);
    try {
      const reportHtml = generateReportHtml();
      
      const { data, error } = await supabase.functions.invoke('send-dd-report', {
        body: {
          companyName: result.companyName,
          recipientEmails: toEmails,
          ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
          reportHtml,
        },
      });

      if (error) throw new Error(error.message);
      
      if (data.success) {
        toast({ title: 'Email Sent', description: `DD report sent to ${toEmails.join(', ')}` });
        setShowEmailDialog(false);
        setToEmails([]);
        setCcEmails([]);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  }, [result, toEmails, ccEmails, generateReportHtml, toast]);

  const downloadPDF = useCallback(() => {
    if (!result || !reportRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups to download PDF', variant: 'destructive' });
      return;
    }

    const content = reportRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deep Due Diligence - ${result.companyName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
            h1, h2, h3, h4 { margin-bottom: 12px; }
            h1 { font-size: 28px; color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
            h2 { font-size: 20px; color: #1e40af; margin-top: 24px; }
            h3 { font-size: 16px; color: #334155; }
            p, li { margin-bottom: 8px; font-size: 14px; }
            ul { padding-left: 20px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .score { font-size: 48px; font-weight: bold; color: #3b82f6; }
            .section { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
            .metric { text-align: center; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; }
            .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .metric-label { font-size: 12px; color: #64748b; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-yellow { background: #fef9c3; color: #854d0e; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0; font-size: 13px; }
            th { background: #f1f5f9; font-weight: 600; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
            @media print { body { padding: 20px; } .section { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Deep Due Diligence Report</h1>
              <p><strong>${result.companyName}</strong>${result.websiteUrl ? ` • ${result.websiteUrl}` : ''}</p>
              <p style="color: #64748b; font-size: 12px;">Generated: ${new Date(result.generatedAt).toLocaleDateString()}</p>
            </div>
            <div style="text-align: right;">
              <div class="score">${result.executiveSummary.investmentScore}</div>
              <div style="font-size: 12px; color: #64748b;">Investment Score</div>
            </div>
          </div>

          <div class="section">
            <h2>Executive Summary</h2>
            <p><span class="badge badge-${result.executiveSummary.verdict.includes('pass') && !result.executiveSummary.verdict.includes('concerns') ? 'green' : result.executiveSummary.verdict === 'conditional' || result.executiveSummary.verdict === 'pass_with_concerns' ? 'yellow' : 'red'}">${result.executiveSummary.verdict.replace(/_/g, ' ').toUpperCase()}</span></p>
            <p style="font-size: 16px; margin: 12px 0;">${result.executiveSummary.oneLiner}</p>
            <div class="grid">
              <div>
                <h4 style="color: #166534;">Key Highlights</h4>
                <ul>${result.executiveSummary.keyHighlights.map(h => `<li>${h}</li>`).join('')}</ul>
              </div>
              <div>
                <h4 style="color: #991b1b;">Critical Risks</h4>
                <ul>${result.executiveSummary.criticalRisks.map(r => `<li>${r}</li>`).join('')}</ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>TAM Analysis</h2>
            <div class="grid-4">
              <div class="metric"><div class="metric-value">${formatCurrency(result.tamAnalysis.tam)}</div><div class="metric-label">TAM</div></div>
              <div class="metric"><div class="metric-value">${formatCurrency(result.tamAnalysis.sam)}</div><div class="metric-label">SAM</div></div>
              <div class="metric"><div class="metric-value">${formatCurrency(result.tamAnalysis.som)}</div><div class="metric-label">SOM</div></div>
              <div class="metric"><div class="metric-value">${result.tamAnalysis.cagr}%</div><div class="metric-label">CAGR</div></div>
            </div>
            <p style="margin-top: 12px;"><strong>Methodology:</strong> ${result.tamAnalysis.methodology}</p>
            <p><span class="badge badge-${result.tamAnalysis.validation === 'validated' ? 'green' : result.tamAnalysis.validation === 'questionable' ? 'yellow' : 'red'}">Validation: ${result.tamAnalysis.validation}</span></p>
          </div>

          <div class="section">
            <h2>Moat Analysis</h2>
            <p><strong>Overall Score:</strong> ${result.moatAnalysis.overallScore}/10</p>
            <p><strong>Time to Replicate:</strong> ${result.moatAnalysis.timeToReplicate}</p>
            <p><strong>Sustainability:</strong> ${result.moatAnalysis.sustainability}</p>
            <table>
              <tr><th>Moat Type</th><th>Strength</th><th>Reasoning</th></tr>
              ${result.moatAnalysis.moatTypes.map(m => `<tr><td>${m.type}</td><td><span class="badge badge-${m.strength === 'strong' ? 'green' : m.strength === 'moderate' ? 'yellow' : 'red'}">${m.strength}</span></td><td>${m.reasoning}</td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Competitor Analysis</h2>
            <table>
              <tr><th>Name</th><th>Stage</th><th>Total Funding</th><th>Valuation</th><th>Position</th></tr>
              ${result.competitorAnalysis.directCompetitors.map(c => `<tr><td><strong>${c.name}</strong><br/><span style="font-size:11px;color:#64748b;">${c.country}</span></td><td>${c.fundingStage}</td><td>${formatCurrency(c.totalFunding)}</td><td>${c.valuation ? formatCurrency(c.valuation) : 'N/A'}</td><td><span class="badge badge-blue">${c.marketPosition}</span></td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Unit Economics</h2>
            <p><span class="badge badge-${result.unitEconomics.assessment === 'excellent' || result.unitEconomics.assessment === 'good' ? 'green' : result.unitEconomics.assessment === 'average' ? 'yellow' : 'red'}">${result.unitEconomics.assessment.toUpperCase()}</span></p>
            <div class="grid-4" style="margin-top: 12px;">
              <div class="metric"><div class="metric-value">${result.unitEconomics.ltv ? formatCurrency(result.unitEconomics.ltv) : 'N/A'}</div><div class="metric-label">LTV</div></div>
              <div class="metric"><div class="metric-value">${result.unitEconomics.cac ? formatCurrency(result.unitEconomics.cac) : 'N/A'}</div><div class="metric-label">CAC</div></div>
              <div class="metric"><div class="metric-value">${result.unitEconomics.ltvCacRatio ? result.unitEconomics.ltvCacRatio.toFixed(1) + 'x' : 'N/A'}</div><div class="metric-label">LTV/CAC</div></div>
              <div class="metric"><div class="metric-value">${result.unitEconomics.grossMargin ? result.unitEconomics.grossMargin + '%' : 'N/A'}</div><div class="metric-label">Gross Margin</div></div>
            </div>
          </div>

          <div class="section">
            <h2>Risk Assessment</h2>
            <p><strong>Overall Risk:</strong> <span class="badge badge-${result.riskAssessment.overallRisk === 'low' ? 'green' : result.riskAssessment.overallRisk === 'medium' ? 'yellow' : 'red'}">${result.riskAssessment.overallRisk.toUpperCase()}</span></p>
            <div class="grid" style="margin-top: 12px;">
              ${result.riskAssessment.categories.map(cat => `<div><h4>${cat.category}</h4><span class="badge badge-${cat.level === 'low' ? 'green' : cat.level === 'medium' ? 'yellow' : 'red'}">${cat.level}</span><ul>${cat.factors.map(f => `<li>${f}</li>`).join('')}</ul></div>`).join('')}
            </div>
          </div>

          <div class="section">
            <h2>Investment Thesis</h2>
            <p><span class="badge badge-${result.investmentThesis.recommendation.includes('invest') && !result.investmentThesis.recommendation.includes('pass') ? 'green' : result.investmentThesis.recommendation === 'conditional' ? 'yellow' : 'red'}">${result.investmentThesis.recommendation.replace(/_/g, ' ').toUpperCase()}</span></p>
            <p style="margin-top: 12px;">${result.investmentThesis.reasoning}</p>
            <h4 style="margin-top: 16px;">Key Metrics vs Benchmarks</h4>
            <table>
              <tr><th>Metric</th><th>Value</th><th>Benchmark</th><th>Status</th></tr>
              ${result.investmentThesis.keyMetrics.map(km => `<tr><td>${km.metric}</td><td>${km.value}</td><td>${km.benchmark}</td><td><span class="badge badge-${km.status === 'above' ? 'green' : km.status === 'at' ? 'yellow' : 'red'}">${km.status}</span></td></tr>`).join('')}
            </table>
          </div>

          <div class="footer">
            <p>Generated by Deep Due Diligence AI • ${new Date().toLocaleString()}</p>
            <p>This report is for informational purposes only and does not constitute investment advice.</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast({ title: 'PDF Ready', description: 'Use your browser\'s print dialog to save as PDF' });
  }, [result, toast]);

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
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={downloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)}>
                    New Analysis
                  </Button>
                </div>
              </div>

              {/* Hidden ref for PDF generation */}
              <div ref={reportRef} className="sr-only" aria-hidden="true" />

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

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send DD Report via Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* To Emails */}
            <div className="space-y-2">
              <Label>To (Recipients) *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {toEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeToEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newToEmail}
                  onChange={(e) => setNewToEmail(e.target.value)}
                  placeholder="Add recipient email"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToEmail())}
                />
                <Button type="button" variant="outline" onClick={addToEmail}>
                  Add
                </Button>
              </div>
            </div>

            {/* CC Emails */}
            <div className="space-y-2">
              <Label>CC (Optional)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {ccEmails.map((email) => (
                  <Badge key={email} variant="outline" className="gap-1">
                    {email}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeCcEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newCcEmail}
                  onChange={(e) => setNewCcEmail(e.target.value)}
                  placeholder="Add CC email"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCcEmail())}
                />
                <Button type="button" variant="outline" onClick={addCcEmail}>
                  Add
                </Button>
              </div>
            </div>

            {result && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Report Summary</p>
                <p className="text-sm text-muted-foreground">
                  Deep Due Diligence report for <strong>{result.companyName}</strong> will be sent as an HTML email.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={isSendingEmail || toEmails.length === 0}>
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
