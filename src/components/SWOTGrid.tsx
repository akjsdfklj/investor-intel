import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SWOTAnalysis } from '@/types';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface SWOTGridProps {
  swot: SWOTAnalysis;
}

export function SWOTGrid({ swot }: SWOTGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strengths */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {swot.strengths.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <TrendingDown className="w-5 h-5" />
            Weaknesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {swot.weaknesses.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
            <Target className="w-5 h-5" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {swot.opportunities.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Threats */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Threats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {swot.threats.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
