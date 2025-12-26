import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BulkRankingItem, BulkStartupEntry } from '@/types';
import { ArrowUpDown, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';

interface BulkComparisonTableProps {
  rankings: BulkRankingItem[];
  startups: BulkStartupEntry[];
  onViewDeal?: (startupId: string) => void;
}

type SortKey = 'rank' | 'score' | 'team' | 'market' | 'product' | 'moat' | 'financials';

export function BulkComparisonTable({ rankings, startups, onViewDeal }: BulkComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDesc, setSortDesc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(key === 'rank' ? false : true);
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    let aVal: number, bVal: number;
    
    if (sortKey === 'rank') {
      aVal = a.rank;
      bVal = b.rank;
    } else if (sortKey === 'score') {
      aVal = a.score;
      bVal = b.score;
    } else {
      aVal = a.breakdown[sortKey];
      bVal = b.breakdown[sortKey];
    }

    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 4) return <Badge className="bg-emerald-500">{score.toFixed(1)}</Badge>;
    if (score >= 3) return <Badge className="bg-primary">{score.toFixed(1)}</Badge>;
    if (score >= 2) return <Badge className="bg-amber-500">{score.toFixed(1)}</Badge>;
    return <Badge variant="destructive">{score.toFixed(1)}</Badge>;
  };

  const getTrendIcon = (score: number, avg: number) => {
    const diff = score - avg;
    if (diff > 0.5) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (diff < -0.5) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const avgScores = {
    team: rankings.reduce((sum, r) => sum + r.breakdown.team, 0) / rankings.length,
    market: rankings.reduce((sum, r) => sum + r.breakdown.market, 0) / rankings.length,
    product: rankings.reduce((sum, r) => sum + r.breakdown.product, 0) / rankings.length,
    moat: rankings.reduce((sum, r) => sum + r.breakdown.moat, 0) / rankings.length,
    financials: rankings.reduce((sum, r) => sum + r.breakdown.financials, 0) / rankings.length,
  };

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 All Startups Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Rank" sortKeyName="rank" />
                <TableHead className="min-w-[150px]">Startup</TableHead>
                <SortableHeader label="Team" sortKeyName="team" />
                <SortableHeader label="Market" sortKeyName="market" />
                <SortableHeader label="Product" sortKeyName="product" />
                <SortableHeader label="Moat" sortKeyName="moat" />
                <SortableHeader label="Financials" sortKeyName="financials" />
                <SortableHeader label="Overall" sortKeyName="score" />
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRankings.map((ranking) => (
                <TableRow 
                  key={ranking.startupId}
                  className={ranking.rank <= 3 ? 'bg-primary/5' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ranking.rank <= 3 ? (
                        <span className="text-lg">
                          {ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium w-6 text-center">
                          #{ranking.rank}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{ranking.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getScoreBadge(ranking.breakdown.team)}
                      {getTrendIcon(ranking.breakdown.team, avgScores.team)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getScoreBadge(ranking.breakdown.market)}
                      {getTrendIcon(ranking.breakdown.market, avgScores.market)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getScoreBadge(ranking.breakdown.product)}
                      {getTrendIcon(ranking.breakdown.product, avgScores.product)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getScoreBadge(ranking.breakdown.moat)}
                      {getTrendIcon(ranking.breakdown.moat, avgScores.moat)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getScoreBadge(ranking.breakdown.financials)}
                      {getTrendIcon(ranking.breakdown.financials, avgScores.financials)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`font-bold ${
                        ranking.score >= 80 ? 'border-emerald-500 text-emerald-500' :
                        ranking.score >= 60 ? 'border-primary text-primary' :
                        'border-amber-500 text-amber-500'
                      }`}
                    >
                      {ranking.score}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDeal?.(ranking.startupId)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
