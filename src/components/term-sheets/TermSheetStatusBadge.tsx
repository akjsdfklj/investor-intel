import { Badge } from '@/components/ui/badge';
import { FileText, Send, Eye, CheckCircle } from 'lucide-react';
import { TermSheetStatus } from '@/types';

interface TermSheetStatusBadgeProps {
  status: TermSheetStatus;
  className?: string;
}

const statusConfig: Record<TermSheetStatus, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', icon: FileText, variant: 'secondary' },
  sent: { label: 'Sent', icon: Send, variant: 'default' },
  opened: { label: 'Viewed', icon: Eye, variant: 'outline' },
  signed: { label: 'Signed', icon: CheckCircle, variant: 'default' },
};

export function TermSheetStatusBadge({ status, className }: TermSheetStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`gap-1 ${status === 'signed' ? 'bg-green-600 hover:bg-green-700' : ''} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
