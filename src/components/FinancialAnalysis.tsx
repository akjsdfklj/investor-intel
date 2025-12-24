import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/KPICard';
import { ForecastChart } from '@/components/ForecastChart';
import { PeerBenchmarkTable } from '@/components/PeerBenchmarkTable';
import { Loader2, TrendingUp, BarChart3, Users, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FinancialAnalysis as FinancialAnalysisType, FinancialKPIs, Deal } from '@/types';

interface FinancialAnalysisProps {
  deal: Deal;
  financialAnalysis?: FinancialAnalysisType;
  onUpdate: (analysis: FinancialAnalysisType) => void;
}

const defaultKPIs: FinancialKPIs = {
  arpu: null,
  arr: null,
  mrr: null,
  revenue: null,
  revenueGrowthRate: null,
  grossMargin: null,
  profit: null,
  ebitda: null,
  ebitdaMargin: null,
  netMargin: null,
  totalCustomers: null,
  cac: null,
  ltv: null,
  ltvCacRatio: null,
  churnRate: null,
  customerLifeCycle: null,
  paybackPeriod: null,
  avgOrderValue: null,
  purchaseFrequency: null,
  sales: null,
  salesGrowthRate: null,
  productLifeCycleStage: null,
};

export function FinancialAnalysis({ deal, financialAnalysis, onUpdate }: FinancialAnalysisProps) {
  const [kpis, setKpis] = useState<FinancialKPIs>(financialAnalysis?.kpis || defaultKPIs);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateKPI = (key: keyof FinancialKPIs, value: number | null) => {
    setKpis(prev => ({ ...prev, [key]: value }));
  };

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-financials', {
        body: {
          kpis,
          sector: deal.sector,
          dealName: deal.name,
          mode: 'forecast',
        },
      });

      if (error) throw error;

      const updatedAnalysis: FinancialAnalysisType = {
        kpis,
        peerBenchmarks: data.peerBenchmarks || [],
        forecasts: data.forecasts || [],
        assumptions: data.assumptions || [],
        aiInsights: data.aiInsights || '',
        lastUpdated: new Date().toISOString(),
      };

      onUpdate(updatedAnalysis);
      toast({
        title: 'Forecast Generated',
        description: 'Financial analysis and 5-year projections are ready.',
      });
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate forecast. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const productLifeCycleOptions = ['introduction', 'growth', 'maturity', 'decline'] as const;

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Financial Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Edit KPIs below and generate AI-powered forecasts
          </p>
        </div>
        <Button onClick={generateForecast} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Forecast
            </>
          )}
        </Button>
      </div>

      {/* KPI Input Sections */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue" className="text-xs">
            <DollarSign className="mr-1 h-3 w-3" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="profitability" className="text-xs">
            <BarChart3 className="mr-1 h-3 w-3" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="unit-economics" className="text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            Unit Econ
          </TabsTrigger>
          <TabsTrigger value="product" className="text-xs">
            <Package className="mr-1 h-3 w-3" />
            Product
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="ARPU (Monthly)"
              value={kpis.arpu}
              prefix="$"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'arpu')?.industryAvg}
              onChange={(v) => updateKPI('arpu', v)}
            />
            <KPICard
              label="MRR"
              value={kpis.mrr}
              prefix="$"
              onChange={(v) => updateKPI('mrr', v)}
            />
            <KPICard
              label="ARR"
              value={kpis.arr}
              prefix="$"
              onChange={(v) => updateKPI('arr', v)}
            />
            <KPICard
              label="Total Revenue"
              value={kpis.revenue}
              prefix="$"
              onChange={(v) => updateKPI('revenue', v)}
            />
            <KPICard
              label="Revenue Growth"
              value={kpis.revenueGrowthRate}
              unit="%"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'revenueGrowthRate')?.industryAvg}
              onChange={(v) => updateKPI('revenueGrowthRate', v)}
            />
            <KPICard
              label="Sales"
              value={kpis.sales}
              prefix="$"
              onChange={(v) => updateKPI('sales', v)}
            />
            <KPICard
              label="Sales Growth"
              value={kpis.salesGrowthRate}
              unit="%"
              onChange={(v) => updateKPI('salesGrowthRate', v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Gross Margin"
              value={kpis.grossMargin}
              unit="%"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'grossMargin')?.industryAvg}
              onChange={(v) => updateKPI('grossMargin', v)}
            />
            <KPICard
              label="Profit"
              value={kpis.profit}
              prefix="$"
              onChange={(v) => updateKPI('profit', v)}
            />
            <KPICard
              label="EBITDA"
              value={kpis.ebitda}
              prefix="$"
              onChange={(v) => updateKPI('ebitda', v)}
            />
            <KPICard
              label="EBITDA Margin"
              value={kpis.ebitdaMargin}
              unit="%"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'ebitdaMargin')?.industryAvg}
              onChange={(v) => updateKPI('ebitdaMargin', v)}
            />
            <KPICard
              label="Net Margin"
              value={kpis.netMargin}
              unit="%"
              onChange={(v) => updateKPI('netMargin', v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Total Customers"
              value={kpis.totalCustomers}
              onChange={(v) => updateKPI('totalCustomers', v)}
            />
            <KPICard
              label="CAC"
              value={kpis.cac}
              prefix="$"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'cac')?.industryAvg}
              onChange={(v) => updateKPI('cac', v)}
            />
            <KPICard
              label="LTV"
              value={kpis.ltv}
              prefix="$"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'ltv')?.industryAvg}
              onChange={(v) => updateKPI('ltv', v)}
            />
            <KPICard
              label="LTV:CAC Ratio"
              value={kpis.ltvCacRatio}
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'ltvCacRatio')?.industryAvg}
              onChange={(v) => updateKPI('ltvCacRatio', v)}
            />
            <KPICard
              label="Churn Rate"
              value={kpis.churnRate}
              unit="%"
              industryAvg={financialAnalysis?.peerBenchmarks?.find(b => b.metricKey === 'churnRate')?.industryAvg}
              onChange={(v) => updateKPI('churnRate', v)}
            />
            <KPICard
              label="Customer Lifecycle"
              value={kpis.customerLifeCycle}
              unit=" mo"
              onChange={(v) => updateKPI('customerLifeCycle', v)}
            />
            <KPICard
              label="Payback Period"
              value={kpis.paybackPeriod}
              unit=" mo"
              onChange={(v) => updateKPI('paybackPeriod', v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="unit-economics" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Avg Order Value"
              value={kpis.avgOrderValue}
              prefix="$"
              onChange={(v) => updateKPI('avgOrderValue', v)}
            />
            <KPICard
              label="Purchase Frequency"
              value={kpis.purchaseFrequency}
              unit="/yr"
              onChange={(v) => updateKPI('purchaseFrequency', v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="product" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Lifecycle Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {productLifeCycleOptions.map((stage) => (
                  <Button
                    key={stage}
                    variant={kpis.productLifeCycleStage === stage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateKPI('productLifeCycleStage', stage as any)}
                    className="capitalize"
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forecast Results */}
      {financialAnalysis && (
        <div className="space-y-6">
          <ForecastChart forecasts={financialAnalysis.forecasts} />
          
          <PeerBenchmarkTable benchmarks={financialAnalysis.peerBenchmarks} />

          {/* AI Insights */}
          {financialAnalysis.aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {financialAnalysis.aiInsights}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assumptions */}
          {financialAnalysis.assumptions && financialAnalysis.assumptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forecast Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {financialAnalysis.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
