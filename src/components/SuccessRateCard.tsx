import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvestmentSuccessRate } from '@/types';
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface SuccessRateCardProps {
  successRate: InvestmentSuccessRate;
}

export function SuccessRateCard({ successRate }: SuccessRateCardProps) {
  const getColor = (probability: number) => {
    if (probability >= 70) return { text: 'text-green-500', bg: 'bg-green-500', label: 'High Potential' };
    if (probability >= 50) return { text: 'text-blue-500', bg: 'bg-blue-500', label: 'Moderate Potential' };
    if (probability >= 30) return { text: 'text-amber-500', bg: 'bg-amber-500', label: 'Risky' };
    return { text: 'text-red-500', bg: 'bg-red-500', label: 'High Risk' };
  };

  const color = getColor(successRate.probability);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (successRate.probability / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl gradient-text flex items-center gap-2">
          <Target className="w-5 h-5" />
          Investment Success Probability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress */}
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className={color.text}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${color.text}`}>
                {successRate.probability}%
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <Badge className={`${color.bg} text-white`}>{color.label}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Confidence:</span>
              <Badge variant="outline" className="capitalize">
                {successRate.confidence}
              </Badge>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Analysis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {successRate.reasoning}
          </p>
        </div>

        {/* Key Strengths & Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Key Strengths
            </h4>
            <ul className="space-y-1">
              {successRate.keyStrengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Key Risks
            </h4>
            <ul className="space-y-1">
              {successRate.keyRisks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
