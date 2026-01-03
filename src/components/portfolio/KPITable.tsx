import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PortfolioKPI } from '@/types';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPITableProps {
  kpis: PortfolioKPI[];
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '-';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '-';
  return value.toLocaleString();
};

const formatPercent = (value: number | null | undefined): string => {
  if (value == null) return '-';
  return `${value.toFixed(1)}%`;
};

function GrowthIndicator({ current, previous }: { current?: number | null; previous?: number | null }) {
  if (current == null || previous == null || previous === 0) {
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  }
  const growth = ((current - previous) / previous) * 100;
  if (growth > 0) {
    return (
      <span className="flex items-center text-green-600 text-xs">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        +{growth.toFixed(0)}%
      </span>
    );
  }
  if (growth < 0) {
    return (
      <span className="flex items-center text-red-600 text-xs">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {growth.toFixed(0)}%
      </span>
    );
  }
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

export function KPITable({ kpis }: KPITableProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No KPI data yet. Add your first entry to start tracking.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Customers</TableHead>
            <TableHead className="text-right">Burn Rate</TableHead>
            <TableHead className="text-right">Runway</TableHead>
            <TableHead className="text-right">Churn</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi, index) => {
            const prevKPI = kpis[index + 1];
            return (
              <TableRow key={kpi.id}>
                <TableCell className="font-medium">
                  <div>
                    <span>{format(new Date(kpi.periodDate), 'MMM yyyy')}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({kpi.periodType})
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{formatCurrency(kpi.mrr)}</span>
                    <GrowthIndicator current={kpi.mrr} previous={prevKPI?.mrr} />
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(kpi.revenue)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{formatNumber(kpi.customers)}</span>
                    <GrowthIndicator current={kpi.customers} previous={prevKPI?.customers} />
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(kpi.burnRate)}</TableCell>
                <TableCell className="text-right">
                  {kpi.runwayMonths ? `${kpi.runwayMonths}mo` : '-'}
                </TableCell>
                <TableCell className="text-right">{formatPercent(kpi.churnRate)}</TableCell>
                <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">
                  {kpi.notes || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
