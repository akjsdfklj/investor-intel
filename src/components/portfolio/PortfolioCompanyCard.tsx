import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PortfolioCompany } from '@/types';
import { Building2, TrendingUp, TrendingDown, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PortfolioCompanyCardProps {
  company: PortfolioCompany;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '-';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function PortfolioCompanyCard({ company }: PortfolioCompanyCardProps) {
  const navigate = useNavigate();

  const valuationChange = company.valuationAtInvestment && company.currentValuation
    ? ((company.currentValuation - company.valuationAtInvestment) / company.valuationAtInvestment) * 100
    : null;

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    exited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    written_off: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/portfolio/${company.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{company.name}</h3>
              {company.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {company.sector && (
                <Badge variant="secondary" className="text-xs">
                  {company.sector}
                </Badge>
              )}
              <Badge className={`text-xs ${statusColors[company.status]}`}>
                {company.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Invested</p>
            <p className="font-medium">{formatCurrency(company.investmentAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Ownership</p>
            <p className="font-medium">{company.ownershipPercentage?.toFixed(1) || '-'}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Val.</p>
            <div className="flex items-center gap-1">
              <p className="font-medium">{formatCurrency(company.currentValuation)}</p>
              {valuationChange !== null && (
                <span className={`flex items-center text-xs ${valuationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {valuationChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(valuationChange).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
