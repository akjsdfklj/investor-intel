import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { EnhancedCompetitor } from '@/types';

interface CompetitorRadarChartProps {
  startupName: string;
  startupScores: {
    team: number;
    market: number;
    product: number;
    moat: number;
    financials: number;
  };
  competitors: EnhancedCompetitor[];
}

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function CompetitorRadarChart({ 
  startupName, 
  startupScores, 
  competitors 
}: CompetitorRadarChartProps) {
  const metrics = [
    { key: 'team', label: 'Team' },
    { key: 'market', label: 'Market' },
    { key: 'product', label: 'Product' },
    { key: 'moat', label: 'Moat' },
    { key: 'financials', label: 'Financials' },
  ];

  // Estimate competitor scores from their data
  const getCompetitorScores = (comp: EnhancedCompetitor) => ({
    team: comp.executives?.length > 2 ? 4 : 3,
    market: comp.comparison?.marketPosition === 'leader' ? 5 : 
            comp.comparison?.marketPosition === 'challenger' ? 4 : 3,
    product: (comp.productFeatures?.filter(f => f.hasFeature).length || 0) > 5 ? 4 : 3,
    moat: comp.comparison?.threatLevel === 'high' ? 4 : 
          comp.comparison?.threatLevel === 'medium' ? 3 : 2,
    financials: comp.kpis?.growthRate && comp.kpis.growthRate > 50 ? 4 : 3,
  });

  const data = metrics.map(({ key, label }) => {
    const result: Record<string, string | number> = {
      metric: label,
      [startupName]: startupScores[key as keyof typeof startupScores] || 0,
    };
    
    competitors.slice(0, 4).forEach(comp => {
      const scores = getCompetitorScores(comp);
      result[comp.name] = scores[key as keyof typeof scores] || 0;
    });
    
    return result;
  });

  const allEntities = [startupName, ...competitors.slice(0, 4).map(c => c.name)];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Competitive Position Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 5]} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              {allEntities.map((entity, index) => (
                <Radar
                  key={entity}
                  name={entity}
                  dataKey={entity}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={index === 0 ? 0.3 : 0.1}
                  strokeWidth={index === 0 ? 2 : 1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
