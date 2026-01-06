import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Sparkles, Send, Eye, CheckCircle } from 'lucide-react';
import { useTermSheets } from '@/hooks/useTermSheets';
import { usePipelineDeals } from '@/hooks/usePipelineDeals';
import { TermSheet, TermSheetStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { AITermSheetWizard } from '@/components/term-sheets/AITermSheetWizard';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number | null): string => {
  if (!amount) return '-';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

const getStatusIcon = (status: TermSheetStatus) => {
  switch (status) {
    case 'draft': return <FileText className="w-4 h-4" />;
    case 'sent': return <Send className="w-4 h-4" />;
    case 'opened': return <Eye className="w-4 h-4" />;
    case 'signed': return <CheckCircle className="w-4 h-4" />;
  }
};

const getStatusColor = (status: TermSheetStatus) => {
  switch (status) {
    case 'draft': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'sent': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'opened': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    case 'signed': return 'bg-green-500/10 text-green-600 border-green-500/20';
  }
};

export default function TermSheets() {
  const { termSheets, isLoading } = useTermSheets();
  const { deals } = usePipelineDeals();
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TermSheetStatus>('all');

  const getDealName = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    return deal?.name || 'Unknown Deal';
  };

  const filteredTermSheets = activeTab === 'all'
    ? termSheets
    : termSheets.filter((ts) => ts.status === activeTab);

  const counts = {
    all: termSheets.length,
    draft: termSheets.filter((ts) => ts.status === 'draft').length,
    sent: termSheets.filter((ts) => ts.status === 'sent').length,
    opened: termSheets.filter((ts) => ts.status === 'opened').length,
    signed: termSheets.filter((ts) => ts.status === 'signed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Term Sheets</h1>
            <p className="text-muted-foreground">
              Generate and manage term sheets with AI-powered recommendations
            </p>
          </div>
          <Button onClick={() => setShowWizard(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Create with AI
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {(['all', 'draft', 'sent', 'opened', 'signed'] as const).map((status) => (
            <Card
              key={status}
              className={`cursor-pointer transition-all ${activeTab === status ? 'border-primary' : ''}`}
              onClick={() => setActiveTab(status)}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{counts[status]}</p>
                <p className="text-sm text-muted-foreground capitalize">{status}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Term Sheets List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({counts.sent})</TabsTrigger>
            <TabsTrigger value="opened">Opened ({counts.opened})</TabsTrigger>
            <TabsTrigger value="signed">Signed ({counts.signed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredTermSheets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No term sheets yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create your first AI-powered term sheet to get started.
                </p>
                <Button onClick={() => setShowWizard(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTermSheets.map((ts) => (
                  <TermSheetCard
                    key={ts.id}
                    termSheet={ts}
                    dealName={getDealName(ts.dealId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Wizard Dialog */}
        <AITermSheetWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          deals={deals.filter((d) => d.stage === 'term_sheet' || d.stage === 'ic_review')}
        />
      </main>
    </div>
  );
}

interface TermSheetCardProps {
  termSheet: TermSheet;
  dealName: string;
}

function TermSheetCard({ termSheet, dealName }: TermSheetCardProps) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{dealName}</h3>
                <Badge className={getStatusColor(termSheet.status)}>
                  {getStatusIcon(termSheet.status)}
                  <span className="ml-1 capitalize">{termSheet.status}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="capitalize">{termSheet.templateType.replace('_', ' ')}</span>
                <span>•</span>
                <span>{formatCurrency(termSheet.investmentAmount)} @ {formatCurrency(termSheet.valuationCap)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created {formatDistanceToNow(new Date(termSheet.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              View
            </Button>
            {termSheet.status === 'draft' && (
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
