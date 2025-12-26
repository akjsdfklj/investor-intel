import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BulkStartupEntry } from '@/types';
import { CheckCircle, XCircle, Loader2, FileText, Clock } from 'lucide-react';

interface BulkProcessingStatusProps {
  startups: BulkStartupEntry[];
  overallProgress: number;
}

export function BulkProcessingStatus({ startups, overallProgress }: BulkProcessingStatusProps) {
  const getStatusIcon = (status: BulkStartupEntry['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  const getStatusBadge = (status: BulkStartupEntry['status']) => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-emerald-500">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'parsing':
        return <Badge variant="outline" className="text-primary border-primary">Parsing</Badge>;
      case 'analyzing':
        return <Badge variant="outline" className="text-primary border-primary">Analyzing</Badge>;
      default:
        return null;
    }
  };

  const completed = startups.filter(s => s.status === 'complete').length;
  const errors = startups.filter(s => s.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Processing Due Diligence
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-500 font-medium">{completed} complete</span>
            {errors > 0 && (
              <span className="text-destructive font-medium">{errors} errors</span>
            )}
            <span className="text-muted-foreground">
              {startups.length - completed - errors} remaining
            </span>
          </div>
        </div>
        <Progress value={overallProgress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {startups.map(startup => (
            <div 
              key={startup.id} 
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                startup.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20' :
                startup.status === 'error' ? 'bg-destructive/5 border-destructive/20' :
                startup.status === 'pending' ? 'bg-muted/50 border-border' :
                'bg-primary/5 border-primary/20'
              }`}
            >
              {getStatusIcon(startup.status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium truncate">{startup.name}</span>
                </div>
                {startup.error && (
                  <p className="text-xs text-destructive mt-1">{startup.error}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {startup.status !== 'complete' && startup.status !== 'error' && (
                  <div className="w-24">
                    <Progress value={startup.progress} className="h-2" />
                  </div>
                )}
                {getStatusBadge(startup.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
