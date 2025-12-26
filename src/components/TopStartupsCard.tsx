import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BulkRankingEntry } from '@/types';
import { Trophy, Star, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopStartupsCardProps {
  rankings: BulkRankingEntry[];
  onViewDeal?: (startupId: string) => void;
}

const RANK_COLORS = {
  1: 'from-amber-400 to-yellow-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-amber-600 to-amber-700'
};

const RANK_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

export function TopStartupsCard({ rankings, onViewDeal }: TopStartupsCardProps) {
  const navigate = useNavigate();

  if (rankings.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-2xl font-bold mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          Top 3 Recommendations
        </div>
        <p className="text-muted-foreground">
          AI-ranked based on comprehensive due diligence analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rankings.map((ranking) => (
          <Card 
            key={ranking.startupId}
            className={`relative overflow-hidden ${
              ranking.rank === 1 ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${
              RANK_COLORS[ranking.rank as keyof typeof RANK_COLORS]
            } flex items-center justify-center rounded-bl-2xl`}>
              <span className="text-2xl">{RANK_ICONS[ranking.rank as keyof typeof RANK_ICONS]}</span>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 pr-12">
                <span className="text-xl">#{ranking.rank}</span>
                <span className="font-bold truncate">{ranking.name}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="default" 
                  className={`${
                    ranking.overallScore >= 80 ? 'bg-emerald-500' :
                    ranking.overallScore >= 60 ? 'bg-primary' :
                    'bg-amber-500'
                  }`}
                >
                  Score: {ranking.overallScore}/100
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Reasoning */}
              <p className="text-sm text-muted-foreground line-clamp-3">
                {ranking.reasoning}
              </p>

              {/* Key Strengths */}
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 mb-2">
                  <Star className="w-4 h-4" />
                  Key Strengths
                </div>
                <ul className="space-y-1">
                  {ranking.keyStrengths.slice(0, 3).map((strength, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500 mt-1 flex-shrink-0" />
                      <span className="line-clamp-1">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Risks */}
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-amber-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Risks
                </div>
                <ul className="space-y-1">
                  {ranking.keyRisks.slice(0, 2).map((risk, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="text-amber-500">•</span>
                      <span className="line-clamp-1">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full mt-2"
                variant={ranking.rank === 1 ? 'default' : 'outline'}
                onClick={() => onViewDeal?.(ranking.startupId)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full DD Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
