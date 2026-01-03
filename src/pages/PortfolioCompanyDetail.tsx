import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioKPIs } from '@/hooks/usePortfolioKPIs';
import { KPIEntryForm } from '@/components/portfolio/KPIEntryForm';
import { KPITable } from '@/components/portfolio/KPITable';
import { GrowthChart } from '@/components/portfolio/GrowthChart';
import { ArrowLeft, Plus, ExternalLink, TrendingUp, TrendingDown, Loader2, DollarSign, Users, Flame, Clock } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '-';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function PortfolioCompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { companies, isLoading: portfolioLoading, getCompanyById } = usePortfolio();
  const { kpis, latestKPI, isLoading: kpisLoading, calculateGrowth } = usePortfolioKPIs(companyId);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [chartMetric, setChartMetric] = useState<'mrr' | 'revenue' | 'customers' | 'arr'>('mrr');

  const company = companyId ? getCompanyById(companyId) : undefined;

  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Company not found</p>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/portfolio')}>Back to Portfolio</Button>
          </div>
        </div>
      </div>
    );
  }

  const valuationChange = company.valuationAtInvestment && company.currentValuation
    ? ((company.currentValuation - company.valuationAtInvestment) / company.valuationAtInvestment) * 100
    : null;

  const mrrGrowth = calculateGrowth('mrr');
  const customerGrowth = calculateGrowth('customers');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portfolio')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              {company.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <Badge 
                variant="secondary"
                className={
                  company.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  company.status === 'exited' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }
              >
                {company.status.replace('_', ' ')}
              </Badge>
            </div>
            {company.sector && (
              <p className="text-muted-foreground text-sm">{company.sector}</p>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(company.investmentDate), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(company.investmentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ownership</span>
                <span className="font-medium">{company.ownershipPercentage?.toFixed(2) || '-'}%</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-muted-foreground">Entry Valuation</span>
                <span className="font-medium">{formatCurrency(company.valuationAtInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Valuation</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(company.currentValuation)}</span>
                  {valuationChange !== null && (
                    <span className={`flex items-center text-xs ${valuationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {valuationChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {valuationChange >= 0 ? '+' : ''}{valuationChange.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest KPIs */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Latest KPIs</CardTitle>
              <Button size="sm" onClick={() => setShowKPIForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add KPI
              </Button>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : latestKPI ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <DollarSign className="w-3 h-3" />
                      MRR
                    </div>
                    <p className="font-semibold">{formatCurrency(latestKPI.mrr)}</p>
                    {mrrGrowth !== null && (
                      <p className={`text-xs ${mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}% MoM
                      </p>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Customers
                    </div>
                    <p className="font-semibold">{latestKPI.customers?.toLocaleString() || '-'}</p>
                    {customerGrowth !== null && (
                      <p className={`text-xs ${customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {customerGrowth >= 0 ? '+' : ''}{customerGrowth.toFixed(1)}% MoM
                      </p>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Flame className="w-3 h-3" />
                      Burn Rate
                    </div>
                    <p className="font-semibold">{formatCurrency(latestKPI.burnRate)}/mo</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      Runway
                    </div>
                    <p className="font-semibold">{latestKPI.runwayMonths || '-'} months</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No KPI data yet. Add your first entry.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Growth Chart</TabsTrigger>
            <TabsTrigger value="table">KPI History</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Growth Trends</CardTitle>
                <Select value={chartMetric} onValueChange={(v) => setChartMetric(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mrr">MRR</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="arr">ARR</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <GrowthChart kpis={kpis} metric={chartMetric} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">KPI History</CardTitle>
              </CardHeader>
              <CardContent>
                <KPITable kpis={kpis} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Notes Section */}
        {company.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      <KPIEntryForm
        open={showKPIForm}
        onOpenChange={setShowKPIForm}
        companyId={companyId!}
      />
    </div>
  );
}
