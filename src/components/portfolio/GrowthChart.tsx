import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PortfolioKPI } from '@/types';
import { format } from 'date-fns';

interface GrowthChartProps {
  kpis: PortfolioKPI[];
  metric: 'mrr' | 'revenue' | 'customers' | 'arr';
}

const metricConfig = {
  mrr: { label: 'MRR', color: 'hsl(263, 70%, 50%)', format: 'currency' },
  revenue: { label: 'Revenue', color: 'hsl(142, 71%, 45%)', format: 'currency' },
  customers: { label: 'Customers', color: 'hsl(217, 91%, 60%)', format: 'number' },
  arr: { label: 'ARR', color: 'hsl(25, 95%, 53%)', format: 'currency' },
};

const formatValue = (value: number, type: 'currency' | 'number'): string => {
  if (type === 'currency') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  return value.toLocaleString();
};

export function GrowthChart({ kpis, metric }: GrowthChartProps) {
  const config = metricConfig[metric];
  
  // Sort by date ascending and format data
  const chartData = [...kpis]
    .filter(kpi => kpi[metric] != null)
    .sort((a, b) => new Date(a.periodDate).getTime() - new Date(b.periodDate).getTime())
    .map(kpi => ({
      date: format(new Date(kpi.periodDate), 'MMM yy'),
      value: kpi[metric] as number,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No {config.label} data available
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value) => formatValue(value, config.format as 'currency' | 'number')}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value, config.format as 'currency' | 'number'), config.label]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={config.label}
            stroke={config.color}
            strokeWidth={2}
            dot={{ fill: config.color, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
