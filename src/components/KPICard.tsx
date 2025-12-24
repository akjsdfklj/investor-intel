import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pencil, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number | null;
  unit?: string;
  prefix?: string;
  industryAvg?: number | null;
  trend?: 'up' | 'down' | 'neutral';
  editable?: boolean;
  onChange?: (value: number | null) => void;
}

export function KPICard({
  label,
  value,
  unit = '',
  prefix = '',
  industryAvg,
  trend,
  editable = true,
  onChange
}: KPICardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleSave = () => {
    const numValue = inputValue === '' ? null : parseFloat(inputValue);
    onChange?.(isNaN(numValue as number) ? null : numValue);
    setIsEditing(false);
  };

  const formatValue = (val: number | null) => {
    if (val === null) return '—';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(unit === '%' ? 1 : 0);
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {editable && !isEditing && (
            <button
              onClick={() => {
                setInputValue(value?.toString() || '');
                setIsEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-2">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="h-8 text-lg font-bold"
              placeholder="Enter value"
            />
          </div>
        ) : (
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {prefix}{formatValue(value)}{unit}
              </span>
              {trend && (
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
              )}
            </div>
            
            {industryAvg !== undefined && industryAvg !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Industry avg: {prefix}{formatValue(industryAvg)}{unit}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
