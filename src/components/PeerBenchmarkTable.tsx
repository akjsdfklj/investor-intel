import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IndustryBenchmark } from '@/types';
import { cn } from '@/lib/utils';

interface PeerBenchmarkTableProps {
  benchmarks: IndustryBenchmark[];
}

const formatValue = (val: number | null, isPercentage: boolean = false) => {
  if (val === null) return '—';
  if (isPercentage) return `${val.toFixed(1)}%`;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  if (val < 10) return val.toFixed(1);
  return val.toFixed(0);
};

const ratingConfig = {
  below: { label: 'Below', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  average: { label: 'Average', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  above: { label: 'Above', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  excellent: { label: 'Excellent', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
};

export function PeerBenchmarkTable({ benchmarks }: PeerBenchmarkTableProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No peer benchmarks available. Generate a forecast to see industry comparisons.
        </CardContent>
      </Card>
    );
  }

  const isPercentageMetric = (key: string) => {
    return ['churnRate', 'grossMargin', 'revenueGrowthRate', 'ebitdaMargin', 'netMargin'].includes(key);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Industry Peer Benchmarks</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Your Value</TableHead>
              <TableHead className="text-right">Industry Avg</TableHead>
              <TableHead className="text-right">Top 10%</TableHead>
              <TableHead className="text-center">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benchmarks.map((benchmark, index) => {
              const isPct = isPercentageMetric(benchmark.metricKey);
              const config = ratingConfig[benchmark.rating];
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{benchmark.metric}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatValue(benchmark.startupValue, isPct)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatValue(benchmark.industryAvg, isPct)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatValue(benchmark.topPerformers, isPct)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn('text-xs', config.className)}>
                      {config.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
