import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoatAssessment as MoatAssessmentType } from '@/types';
import { Shield, Lock, Database, Users, Star, ArrowUpDown, Truck, Scale } from 'lucide-react';

interface MoatAssessmentProps {
  moat: MoatAssessmentType;
}

const moatTypeConfig: Record<MoatAssessmentType['type'], { label: string; icon: React.ReactNode; color: string }> = {
  none: { label: 'No Clear Moat', icon: <Shield className="w-4 h-4" />, color: 'bg-muted' },
  tech_ip: { label: 'Technology / IP', icon: <Lock className="w-4 h-4" />, color: 'bg-blue-500' },
  data_advantage: { label: 'Data Advantage', icon: <Database className="w-4 h-4" />, color: 'bg-purple-500' },
  network_effects: { label: 'Network Effects', icon: <Users className="w-4 h-4" />, color: 'bg-green-500' },
  brand: { label: 'Brand Power', icon: <Star className="w-4 h-4" />, color: 'bg-amber-500' },
  switching_costs: { label: 'Switching Costs', icon: <ArrowUpDown className="w-4 h-4" />, color: 'bg-orange-500' },
  distribution: { label: 'Distribution', icon: <Truck className="w-4 h-4" />, color: 'bg-cyan-500' },
  regulation: { label: 'Regulatory', icon: <Scale className="w-4 h-4" />, color: 'bg-rose-500' },
};

export function MoatAssessment({ moat }: MoatAssessmentProps) {
  const config = moatTypeConfig[moat.type];
  const scorePercentage = (moat.score / 10) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-blue-500';
    if (score >= 4) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl gradient-text flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Moat Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(moat.score)}`}>
              {moat.score}
            </div>
            <div className="text-sm text-muted-foreground">/10</div>
          </div>
          
          <div className="flex-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(moat.score)} transition-all duration-500`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>
        </div>

        {/* Moat Type */}
        <div className="flex items-center gap-3">
          <Badge className={`${config.color} text-white flex items-center gap-1.5 px-3 py-1`}>
            {config.icon}
            {config.label}
          </Badge>
        </div>

        {/* Reasoning */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Analysis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {moat.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
