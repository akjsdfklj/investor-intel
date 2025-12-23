import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'loading';
  label: string;
  className?: string;
}

export function ConnectionStatus({ status, label, className }: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      ) : status === 'connected' ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={cn(
        'text-sm',
        status === 'connected' ? 'text-green-600' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  );
}
