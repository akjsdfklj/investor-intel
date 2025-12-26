import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Minus } from 'lucide-react';
import { EnhancedCompetitor } from '@/types';

interface CompetitorFeatureMatrixProps {
  startupName: string;
  startupFeatures: { feature: string; hasFeature: boolean }[];
  competitors: EnhancedCompetitor[];
}

export function CompetitorFeatureMatrix({ 
  startupName, 
  startupFeatures, 
  competitors 
}: CompetitorFeatureMatrixProps) {
  // Get all unique features
  const allFeatures = new Set<string>();
  startupFeatures.forEach(f => allFeatures.add(f.feature));
  competitors.forEach(c => c.productFeatures?.forEach(f => allFeatures.add(f.feature)));
  
  const featureList = Array.from(allFeatures);

  const hasFeature = (name: string, feature: string): boolean | null => {
    if (name === startupName) {
      const f = startupFeatures.find(sf => sf.feature === feature);
      return f ? f.hasFeature : null;
    }
    const comp = competitors.find(c => c.name === name);
    const f = comp?.productFeatures?.find(pf => pf.feature === feature);
    return f ? f.hasFeature : null;
  };

  const renderIcon = (has: boolean | null) => {
    if (has === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (has) return <Check className="w-5 h-5 text-emerald-500" />;
    return <X className="w-5 h-5 text-destructive" />;
  };

  if (featureList.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Feature Comparison Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Feature</TableHead>
                <TableHead className="text-center bg-primary/10 font-bold">
                  {startupName}
                </TableHead>
                {competitors.slice(0, 5).map(comp => (
                  <TableHead key={comp.name} className="text-center">
                    {comp.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureList.map(feature => (
                <TableRow key={feature}>
                  <TableCell className="font-medium">{feature}</TableCell>
                  <TableCell className="text-center bg-primary/5">
                    {renderIcon(hasFeature(startupName, feature))}
                  </TableCell>
                  {competitors.slice(0, 5).map(comp => (
                    <TableCell key={comp.name} className="text-center">
                      {renderIcon(hasFeature(comp.name, feature))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
