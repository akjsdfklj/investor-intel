import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Building2, DollarSign, PieChart } from 'lucide-react';

interface PortfolioSummaryProps {
  metrics: {
    totalAUM: number;
    totalCompanies: number;
    activeCompanies: number;
    exitedCompanies: number;
    totalCurrentValue: number;
  };
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function PortfolioSummary({ metrics }: PortfolioSummaryProps) {
  const moic = metrics.totalAUM > 0 ? metrics.totalCurrentValue / metrics.totalAUM : 0;

  const cards = [
    {
      title: 'Total Invested',
      value: formatCurrency(metrics.totalAUM),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Portfolio Companies',
      value: metrics.totalCompanies.toString(),
      subtitle: `${metrics.activeCompanies} active · ${metrics.exitedCompanies} exited`,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Current Value',
      value: formatCurrency(metrics.totalCurrentValue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'MOIC',
      value: `${moic.toFixed(2)}x`,
      icon: PieChart,
      color: moic >= 1 ? 'text-green-600' : 'text-red-600',
      bgColor: moic >= 1 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
