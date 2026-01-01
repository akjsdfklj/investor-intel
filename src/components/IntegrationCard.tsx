import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type ConnectionStatus = 'connected' | 'not_configured' | 'error' | 'testing';

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea';
  placeholder?: string;
}

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: ConnectionStatus;
  statusMessage?: string;
  fields: IntegrationField[];
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  onTest?: () => void;
  onSave?: () => void;
  isManaged?: boolean;
  managedMessage?: string;
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Connected',
  },
  not_configured: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Not Configured',
  },
  error: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Error',
  },
  testing: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Testing...',
  },
};

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  statusMessage,
  fields,
  values,
  onValuesChange,
  onTest,
  onSave,
  isManaged,
  managedMessage,
}: IntegrationCardProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = (key: string, value: string) => {
    onValuesChange({ ...values, [key]: value });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', config.bgColor, config.color)}>
            <StatusIcon className={cn('w-4 h-4', status === 'testing' && 'animate-spin')} />
            {config.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isManaged ? (
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">{managedMessage}</p>
          </div>
        ) : (
          <>
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="pr-10"
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => toggleSecret(field.key)}
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {statusMessage && (
              <p className={cn(
                'text-sm',
                status === 'error' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {statusMessage}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              {onTest && (
                <Button variant="outline" onClick={onTest} disabled={status === 'testing'}>
                  {status === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              )}
              {onSave && (
                <Button onClick={onSave} disabled={status === 'testing'}>
                  Save
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
