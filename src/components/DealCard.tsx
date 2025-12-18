import { Deal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles, FileText, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DealCardProps {
  deal: Deal;
  onGenerateDD: (dealId: string) => void;
  onViewDetails: (dealId: string) => void;
  isGenerating: boolean;
}

export function DealCard({ deal, onGenerateDD, onViewDetails, isGenerating }: DealCardProps) {
  const hasReport = !!deal.ddReport;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
              {deal.name}
            </CardTitle>
            {deal.url && (
              <a 
                href={deal.url.startsWith('http') ? deal.url : `https://${deal.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{deal.url}</span>
              </a>
            )}
          </div>
          {hasReport && (
            <Badge variant="secondary" className="bg-score-excellent/10 text-score-excellent border-score-excellent/20">
              <FileText className="w-3 h-3 mr-1" />
              DD Ready
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {deal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {deal.description}
          </p>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          Created {format(new Date(deal.createdAt), 'MMM d, yyyy')}
        </div>

        <div className="flex gap-2 pt-2">
          {hasReport ? (
            <Button 
              onClick={() => onViewDetails(deal.id)}
              className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Report
            </Button>
          ) : (
            <Button 
              onClick={() => onGenerateDD(deal.id)}
              disabled={isGenerating}
              className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate DD
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
