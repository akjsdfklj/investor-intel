import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useDealSources } from '@/hooks/useDealSources';
import { DealSource, GSheetsConfig, FieldMapping } from '@/types';
import { toast } from 'sonner';

interface Props {
  source: DealSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEAL_FIELDS: { key: keyof FieldMapping; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Company Name', required: true },
  { key: 'website_url', label: 'Website URL' },
  { key: 'description', label: 'Description' },
  { key: 'sector', label: 'Sector / Industry' },
  { key: 'founder_name', label: 'Founder Name' },
  { key: 'founder_email', label: 'Founder Email' },
  { key: 'ask_amount', label: 'Ask / Raise Amount' },
  { key: 'valuation', label: 'Valuation' },
];

const NONE = '__none__';

export function FieldMappingDialog({ source, open, onOpenChange }: Props) {
  const { updateSource } = useDealSources();
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});

  const config = source?.config as GSheetsConfig | undefined;

  const loadHeaders = async () => {
    if (!source) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-gsheet-headers', {
        body: { sourceId: source.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setHeaders(data.headers || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load columns';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && source) {
      setMapping((config?.fieldMapping as FieldMapping) || {});
      loadHeaders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.id]);

  const handleSave = async () => {
    if (!source || !config) return;
    if (!mapping.name) {
      toast.error('Company Name mapping is required');
      return;
    }
    setSaving(true);
    try {
      const newConfig: GSheetsConfig = { ...config, fieldMapping: mapping };
      await updateSource(source.id, { config: newConfig });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof FieldMapping, value: string) => {
    setMapping(prev => {
      const next = { ...prev };
      if (value === NONE) delete next[field];
      else next[field] = value;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Field Mapping</DialogTitle>
          <DialogDescription>
            Map columns from your Google Sheet to deal fields. Required for accurate sync.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading columns...' : `${headers.length} columns detected`}
          </p>
          <Button variant="outline" size="sm" onClick={loadHeaders} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEAL_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">
                  {label} {required && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={mapping[key] || NONE}
                  onValueChange={(v) => setField(key, v)}
                  disabled={headers.length === 0}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Not mapped —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading || headers.length === 0}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
