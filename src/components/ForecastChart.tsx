import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { KPIForecast } from '@/types';

interface ForecastChartProps {
  forecasts: KPIForecast[];
}

const formatValue = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
};

const formatCustomers = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toFixed(0);
};

export function ForecastChart({ forecasts }: ForecastChartProps) {
  if (!forecasts || forecasts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No forecast data available. Click "Generate Forecast" to create projections.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">5-Year Financial Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecasts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis tickFormatter={formatValue} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatValue(value), '']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="profitability" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecasts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis tickFormatter={formatValue} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatValue(value), '']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Profit"
                  />
                  <Line
                    type="monotone"
                    dataKey="ebitda"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="EBITDA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecasts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis tickFormatter={formatCustomers} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCustomers(value), '']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Customers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="unit-economics" className="mt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecasts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis tickFormatter={formatValue} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatValue(value), '']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="arpu"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    name="ARPU"
                  />
                  <Line
                    type="monotone"
                    dataKey="ltv"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    name="LTV"
                  />
                  <Line
                    type="monotone"
                    dataKey="cac"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="CAC"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
