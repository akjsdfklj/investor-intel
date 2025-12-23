import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDeals } from '@/hooks/useDeals';
import { Header } from '@/components/Header';
import { ScoreBox } from '@/components/ScoreBox';
import { FounderInquiryForm } from '@/components/FounderInquiryForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Loader2, Calendar, AlertCircle, Globe, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getDeal, isLoading: dealsLoading, generateDD } = useDeals();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const deal = dealId ? getDeal(dealId) : undefined;

  const handleGenerateDD = async () => {
    if (!dealId) return;
    setIsGenerating(true);
    await generateDD(dealId);
    setIsGenerating(false);
  };

  if (authLoading || dealsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Deal Not Found</h1>
          <p className="text-muted-foreground mb-6">This deal doesn't exist or has been deleted</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const ddReport = deal.ddReport;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="ghost" 
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Deal Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{deal.name}</h1>
              {deal.url && (
                <a 
                  href={deal.url.startsWith('http') ? deal.url : `https://${deal.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {deal.url}
                </a>
              )}
              {deal.description && (
                <p className="text-muted-foreground mt-3 max-w-2xl">{deal.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Added {format(new Date(deal.createdAt), 'MMMM d, yyyy')}
              </div>
              {!ddReport && (
                <Button 
                  onClick={handleGenerateDD}
                  disabled={isGenerating}
                  className="gradient-primary text-primary-foreground"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Generate DD with AI
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              DD Analysis
            </TabsTrigger>
            <TabsTrigger value="founder" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Founder Inquiry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            {!ddReport ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">No DD Report Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Click "Generate DD with AI" to analyze this startup
                  </p>
                  <Button 
                    onClick={handleGenerateDD}
                    disabled={isGenerating}
                    className="gradient-primary text-primary-foreground"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Generate DD with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* DD Summary */}
                <Card className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl gradient-text">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{ddReport.summary}</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Generated {format(new Date(ddReport.generatedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                      {ddReport.scrapedContent && ' • Website content analyzed'}
                    </p>
                  </CardContent>
                </Card>

                {/* Score Grid */}
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <h2 className="text-xl font-bold text-foreground mb-4">Investment Scores</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScoreBox label="Team" scoreItem={ddReport.scores.team} />
                    <ScoreBox label="Market" scoreItem={ddReport.scores.market} />
                    <ScoreBox label="Product" scoreItem={ddReport.scores.product} />
                    <ScoreBox label="Moat" scoreItem={ddReport.scores.moat} />
                  </div>
                </div>

                {/* Follow-up Questions */}
                <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <CardHeader>
                    <CardTitle className="text-xl gradient-text">Follow-up Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {ddReport.followUpQuestions.map((question, index) => (
                        <li key={index} className="flex gap-3 text-foreground">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <span className="leading-relaxed">{question}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="founder">
            <FounderInquiryForm 
              dealId={deal.id} 
              dealName={deal.name} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
