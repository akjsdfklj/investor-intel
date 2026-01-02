import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface PipelineFiltersState {
  sector: string | null;
  priority: number | null;
  sourceType: string | null;
}

interface PipelineFiltersProps {
  filters: PipelineFiltersState;
  onFiltersChange: (filters: PipelineFiltersState) => void;
}

const SECTORS = [
  'AI/ML',
  'FinTech',
  'HealthTech',
  'SaaS',
  'E-commerce',
  'EdTech',
  'CleanTech',
  'Cybersecurity',
  'Web3/Crypto',
  'Consumer',
  'Enterprise',
  'Other',
];

export function PipelineFilters({ filters, onFiltersChange }: PipelineFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.sector,
    filters.priority,
    filters.sourceType,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({ sector: null, priority: null, sourceType: null });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Sector
              </label>
              <Select
                value={filters.sector || ''}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, sector: v || null })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sectors</SelectItem>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Priority
              </label>
              <Select
                value={filters.priority?.toString() || ''}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, priority: v ? parseInt(v) : null })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="1">★★★ High</SelectItem>
                  <SelectItem value="2">★★☆ Medium</SelectItem>
                  <SelectItem value="3">★☆☆ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Source
              </label>
              <Select
                value={filters.sourceType || ''}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, sourceType: v || null })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="airtable">Airtable</SelectItem>
                  <SelectItem value="gforms">Google Forms</SelectItem>
                  <SelectItem value="bulk_dd">Bulk DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
