import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Deal, ScenarioModel, FinancialKPIs } from '@/types';

interface ScenarioModelingProps {
  deal: Deal;
  scenarioModel?: ScenarioModel;
  currentKPIs?: FinancialKPIs;
  onUpdate: (model: ScenarioModel) => void;
}

export function ScenarioModeling({ deal, scenarioModel, currentKPIs, onUpdate }: ScenarioModelingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assumptions, setAssumptions] = useState({
    marketGrowth: 15,
    customerGrowth: 25,
    churnRate: 5,
    pricingPower: 3,
  });
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const generateScenarios = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scenario-modeling', {
        body: {
          dealName: deal.name,
          sector: deal.sector,
          currentMetrics: currentKPIs || {
            revenue: deal.ddReport?.financialAnalysis?.kpis?.revenue,
            arpu: deal.ddReport?.financialAnalysis?.kpis?.arpu,
            totalCustomers: deal.ddReport?.financialAnalysis?.kpis?.totalCustomers,
            churnRate: deal.ddReport?.financialAnalysis?.kpis?.churnRate,
          },
          assumptions,
        },
      });

      if (error) throw error;
      if (data.scenarioModel) {
        onUpdate(data.scenarioModel);
        toast({ title: 'Scenarios Generated' });
      }
    } catch (error) {
      console.error('Scenario modeling error:', error);
      toast({ title: 'Generation failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!scenarioModel) {
    return (
      <Card className="border-border/50">
        <CardContent className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Scenario Modeling</h3>
          <p className="text-muted-foreground mb-6">Generate Bear, Base, and Bull case projections with IRR calculations</p>
          
          {/* Assumption Sliders */}
          <div className="max-w-md mx-auto space-y-4 mb-6 text-left">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Market Growth</span>
                <span className="text-foreground font-medium">{assumptions.marketGrowth}%</span>
              </div>
              <Slider
                value={[assumptions.marketGrowth]}
                onValueChange={([v]) => setAssumptions(prev => ({ ...prev, marketGrowth: v }))}
                max={50}
                min={0}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Customer Growth</span>
                <span className="text-foreground font-medium">{assumptions.customerGrowth}%</span>
              </div>
              <Slider
                value={[assumptions.customerGrowth]}
                onValueChange={([v]) => setAssumptions(prev => ({ ...prev, customerGrowth: v }))}
                max={100}
                min={0}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Churn Rate</span>
                <span className="text-foreground font-medium">{assumptions.churnRate}%</span>
              </div>
              <Slider
                value={[assumptions.churnRate]}
                onValueChange={([v]) => setAssumptions(prev => ({ ...prev, churnRate: v }))}
                max={20}
                min={0}
                step={0.5}
              />
            </div>
          </div>

          <Button onClick={generateScenarios} disabled={isLoading} className="gradient-primary text-primary-foreground">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><BarChart3 className="w-4 h-4 mr-2" />Generate Scenarios</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { baseCase, bullCase, bearCase, probabilityWeighted } = scenarioModel;

  // Chart data
  const chartData = [
    { year: 'Y1', bear: bearCase.year1.revenue, base: baseCase.year1.revenue, bull: bullCase.year1.revenue },
    { year: 'Y3', bear: bearCase.year3.revenue, base: baseCase.year3.revenue, bull: bullCase.year3.revenue },
    { year: 'Y5', bear: bearCase.year5.revenue, base: baseCase.year5.revenue, bull: bullCase.year5.revenue },
  ];

  return (
    <div className="space-y-6">
      {/* Probability Weighted Summary */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl gradient-text">Probability-Weighted Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Expected Y5 Revenue</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(probabilityWeighted.expectedRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Expected Exit Valuation</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(probabilityWeighted.expectedValuation)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Expected IRR</p>
              <p className="text-3xl font-bold text-emerald-400">{probabilityWeighted.irr.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Weighted: Bear 20% | Base 50% | Bull 30%
          </p>
        </CardContent>
      </Card>

      {/* Revenue Projection Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="bear" name="Bear Case" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="base" name="Base Case" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="bull" name="Bull Case" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Comparison Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-muted-foreground font-medium">Metric</th>
                <th className="text-center py-3">
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    <TrendingDown className="w-3 h-3 mr-1" />Bear
                  </Badge>
                </th>
                <th className="text-center py-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <Minus className="w-3 h-3 mr-1" />Base
                  </Badge>
                </th>
                <th className="text-center py-3">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />Bull
                  </Badge>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-foreground">Year 1 Revenue</td>
                <td className="py-3 text-center text-red-400">{formatCurrency(bearCase.year1.revenue)}</td>
                <td className="py-3 text-center text-primary">{formatCurrency(baseCase.year1.revenue)}</td>
                <td className="py-3 text-center text-emerald-400">{formatCurrency(bullCase.year1.revenue)}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground">Year 3 Revenue</td>
                <td className="py-3 text-center text-red-400">{formatCurrency(bearCase.year3.revenue)}</td>
                <td className="py-3 text-center text-primary">{formatCurrency(baseCase.year3.revenue)}</td>
                <td className="py-3 text-center text-emerald-400">{formatCurrency(bullCase.year3.revenue)}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground">Year 5 Revenue</td>
                <td className="py-3 text-center text-red-400">{formatCurrency(bearCase.year5.revenue)}</td>
                <td className="py-3 text-center text-primary">{formatCurrency(baseCase.year5.revenue)}</td>
                <td className="py-3 text-center text-emerald-400">{formatCurrency(bullCase.year5.revenue)}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground">Exit Valuation</td>
                <td className="py-3 text-center text-red-400">{formatCurrency(bearCase.exitValuation)}</td>
                <td className="py-3 text-center text-primary">{formatCurrency(baseCase.exitValuation)}</td>
                <td className="py-3 text-center text-emerald-400">{formatCurrency(bullCase.exitValuation)}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground">Multiple</td>
                <td className="py-3 text-center text-muted-foreground">{bearCase.multipleUsed}</td>
                <td className="py-3 text-center text-muted-foreground">{baseCase.multipleUsed}</td>
                <td className="py-3 text-center text-muted-foreground">{bullCase.multipleUsed}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground font-medium">IRR</td>
                <td className="py-3 text-center text-red-400 font-bold">{bearCase.irr.toFixed(1)}%</td>
                <td className="py-3 text-center text-primary font-bold">{baseCase.irr.toFixed(1)}%</td>
                <td className="py-3 text-center text-emerald-400 font-bold">{bullCase.irr.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={generateScenarios} disabled={isLoading} variant="outline">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : 'Regenerate Scenarios'}
        </Button>
      </div>
    </div>
  );
}
