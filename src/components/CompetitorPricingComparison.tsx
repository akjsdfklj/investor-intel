import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedCompetitor, CompetitorPricingTier } from '@/types';
import { DollarSign, Check } from 'lucide-react';

interface CompetitorPricingComparisonProps {
  startupName: string;
  startupPricing: CompetitorPricingTier[];
  competitors: EnhancedCompetitor[];
}

export function CompetitorPricingComparison({ 
  startupName, 
  startupPricing, 
  competitors 
}: CompetitorPricingComparisonProps) {
  const allPricing = [
    { name: startupName, pricing: startupPricing, isStartup: true },
    ...competitors.slice(0, 4).map(c => ({ 
      name: c.name, 
      pricing: c.pricing || [], 
      isStartup: false 
    }))
  ].filter(p => p.pricing.length > 0);

  if (allPricing.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Pricing Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {allPricing.map(({ name, pricing, isStartup }) => (
            <div 
              key={name} 
              className={`rounded-lg border p-4 ${
                isStartup ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold truncate">{name}</h4>
                {isStartup && (
                  <Badge variant="default" className="text-xs">You</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                {pricing.map((tier, idx) => (
                  <div 
                    key={idx} 
                    className="bg-muted/50 rounded-md p-3"
                  >
                    <div className="font-medium text-sm">{tier.tier}</div>
                    <div className="text-lg font-bold text-primary">{tier.price}</div>
                    <ul className="mt-2 space-y-1">
                      {tier.features.slice(0, 3).map((feature, fIdx) => (
                        <li key={fIdx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{tier.features.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
