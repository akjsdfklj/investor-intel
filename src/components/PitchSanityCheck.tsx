import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PitchSanityCheck as PitchSanityCheckType } from '@/types';
import { CheckCircle, AlertCircle, XCircle, Lightbulb, Users, DollarSign, BarChart, Target, AlertTriangle } from 'lucide-react';

interface PitchSanityCheckProps {
  check: PitchSanityCheckType;
}

export function PitchSanityCheck({ check }: PitchSanityCheckProps) {
  const statusConfig = {
    green: { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500', label: 'Complete', textColor: 'text-green-600' },
    amber: { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-amber-500', label: 'Partial', textColor: 'text-amber-600' },
    red: { icon: <XCircle className="w-5 h-5" />, color: 'bg-red-500', label: 'Incomplete', textColor: 'text-red-600' },
  };

  const config = statusConfig[check.status];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl gradient-text">Pitch Sanity Check</CardTitle>
          <Badge className={`${config.color} text-white flex items-center gap-1.5`}>
            {config.icon}
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="w-4 h-4 text-primary" />
              Problem
            </div>
            <p className="text-sm text-muted-foreground pl-6">{check.problem || 'Not identified'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="w-4 h-4 text-primary" />
              Solution
            </div>
            <p className="text-sm text-muted-foreground pl-6">{check.solution || 'Not identified'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="w-4 h-4 text-primary" />
              Target Customer
            </div>
            <p className="text-sm text-muted-foreground pl-6">{check.targetCustomer || 'Not identified'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="w-4 h-4 text-primary" />
              Pricing Model
            </div>
            <p className="text-sm text-muted-foreground pl-6">{check.pricingModel || 'Not identified'}</p>
          </div>
        </div>

        {/* TAM */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <BarChart className="w-4 h-4 text-primary" />
            Claimed TAM
          </div>
          <p className="text-sm text-muted-foreground">{check.claimedTAM || 'Not specified'}</p>
        </div>

        {/* Key Metrics */}
        {check.keyMetrics && check.keyMetrics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Key Metrics Mentioned</h4>
            <div className="flex flex-wrap gap-2">
              {check.keyMetrics.map((metric, index) => (
                <Badge key={index} variant="secondary">{metric}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Info */}
        {check.missingInfo && check.missingInfo.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Missing Information
            </h4>
            <ul className="space-y-1">
              {check.missingInfo.map((info, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {info}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
