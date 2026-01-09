import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Target, Shield, Users, TrendingUp, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useDDReport } from '@/hooks/useDDReport';
import { DDReport } from '@/types';
import { cn } from '@/lib/utils';

interface DDReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  dealName: string;
}

const ScoreBox = ({ label, score, reason }: { label: string; score: number; reason: string }) => {
  const getScoreColor = (s: number) => {
    if (s >= 4) return 'text-green-500 bg-green-500/10';
    if (s >= 3) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <div className={cn('px-2 py-1 rounded-full text-sm font-bold', getScoreColor(score))}>
          {score}/5
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">{reason}</p>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: 'green' | 'amber' | 'red' }) => {
  const config = {
    green: { label: 'Strong', icon: CheckCircle, className: 'bg-green-500/10 text-green-600' },
    amber: { label: 'Needs Attention', icon: AlertCircle, className: 'bg-yellow-500/10 text-yellow-600' },
    red: { label: 'Weak', icon: AlertCircle, className: 'bg-red-500/10 text-red-600' },
  };
  const { label, icon: Icon, className } = config[status];
  
  return (
    <Badge className={cn('gap-1', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

export function DDReportViewer({ open, onOpenChange, reportId, dealName }: DDReportViewerProps) {
  const { getDDReport, isLoading } = useDDReport();
  const [report, setReport] = useState<DDReport | null>(null);

  useEffect(() => {
    if (open && reportId) {
      getDDReport(reportId).then(setReport);
    }
  }, [open, reportId, getDDReport]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            DD Report: {dealName}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !report ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-2 self-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="swot">SWOT</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="moat">Moat</TabsTrigger>
              <TabsTrigger value="investment">Investment</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 pb-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.summary || 'No summary available.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Pitch Sanity Check */}
                {report.pitchSanityCheck && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Pitch Sanity Check</CardTitle>
                      <StatusBadge status={report.pitchSanityCheck.status} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Problem</p>
                          <p className="text-sm">{report.pitchSanityCheck.problem}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Solution</p>
                          <p className="text-sm">{report.pitchSanityCheck.solution}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Target Customer</p>
                          <p className="text-sm">{report.pitchSanityCheck.targetCustomer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pricing Model</p>
                          <p className="text-sm">{report.pitchSanityCheck.pricingModel}</p>
                        </div>
                      </div>
                      {report.pitchSanityCheck.missingInfo && report.pitchSanityCheck.missingInfo.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Missing Information</p>
                          <div className="flex flex-wrap gap-2">
                            {report.pitchSanityCheck.missingInfo.map((item, i) => (
                              <Badge key={i} variant="outline" className="text-yellow-600">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Scores */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Investment Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreBox label="Team" score={report.scores.team.score} reason={report.scores.team.reason} />
                    <ScoreBox label="Market" score={report.scores.market.score} reason={report.scores.market.reason} />
                    <ScoreBox label="Product" score={report.scores.product.score} reason={report.scores.product.reason} />
                    <ScoreBox label="Moat" score={report.scores.moat.score} reason={report.scores.moat.reason} />
                  </div>
                </div>
              </TabsContent>

              {/* SWOT Tab */}
              <TabsContent value="swot" className="mt-4">
                {report.swotAnalysis ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-green-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {report.swotAnalysis.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-green-500">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-red-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          Weaknesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {report.swotAnalysis.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-red-500">•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                          <Target className="w-4 h-4" />
                          Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {report.swotAnalysis.opportunities.map((o, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-blue-500">•</span>
                              {o}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                          <AlertCircle className="w-4 h-4" />
                          Threats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {report.swotAnalysis.threats.map((t, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-yellow-500">•</span>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>SWOT analysis not available for this deal.</p>
                  </Card>
                )}
              </TabsContent>

              {/* Competitors Tab */}
              <TabsContent value="competitors" className="mt-4">
                {report.competitorMapping && report.competitorMapping.length > 0 ? (
                  <div className="space-y-4">
                    {report.competitorMapping.map((comp, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{comp.name}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline">{comp.country}</Badge>
                              <Badge variant="secondary">{comp.fundingStage}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{comp.description}</p>
                          <p className="text-sm"><strong>vs Startup:</strong> {comp.comparison}</p>
                          {comp.websiteUrl && (
                            <a 
                              href={comp.websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Visit Website →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No competitor data available.</p>
                  </Card>
                )}
              </TabsContent>

              {/* Moat Tab */}
              <TabsContent value="moat" className="mt-4">
                {report.moatAssessment ? (
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Moat Score</h3>
                          <p className="text-sm text-muted-foreground">Competitive advantage assessment</p>
                        </div>
                        <div className={cn(
                          'text-4xl font-bold px-4 py-2 rounded-lg',
                          report.moatAssessment.score >= 7 ? 'bg-green-500/10 text-green-600' :
                          report.moatAssessment.score >= 4 ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-red-500/10 text-red-600'
                        )}>
                          {report.moatAssessment.score}/10
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Moat Type</h4>
                        <Badge className="capitalize">
                          <Shield className="w-3 h-3 mr-1" />
                          {report.moatAssessment.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Analysis</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {report.moatAssessment.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2" />
                    <p>Moat assessment not available.</p>
                  </Card>
                )}
              </TabsContent>

              {/* Investment Tab */}
              <TabsContent value="investment" className="mt-4">
                {report.investmentSuccessRate ? (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Success Probability</h3>
                            <p className="text-sm text-muted-foreground">
                              Confidence: {report.investmentSuccessRate.confidence}
                            </p>
                          </div>
                          <div className={cn(
                            'text-4xl font-bold px-4 py-2 rounded-lg',
                            report.investmentSuccessRate.probability >= 70 ? 'bg-green-500/10 text-green-600' :
                            report.investmentSuccessRate.probability >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-red-500/10 text-red-600'
                          )}>
                            {report.investmentSuccessRate.probability}%
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {report.investmentSuccessRate.reasoning}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {report.investmentSuccessRate.keyStrengths.map((s, i) => (
                              <li key={i} className="text-sm flex gap-2">
                                <span className="text-green-500">✓</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-red-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            Key Risks
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {report.investmentSuccessRate.keyRisks.map((r, i) => (
                              <li key={i} className="text-sm flex gap-2">
                                <span className="text-red-500">!</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                    <p>Investment success rate not available.</p>
                  </Card>
                )}
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="mt-4">
                {report.followUpQuestions && report.followUpQuestions.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Follow-up Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {report.followUpQuestions.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground">{q}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No follow-up questions available.</p>
                  </Card>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
