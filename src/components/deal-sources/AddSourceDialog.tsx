import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, FileSpreadsheet, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useDealSources } from '@/hooks/useDealSources';
import { AirtableConfig, GSheetsConfig, FieldMapping } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultFieldMapping: FieldMapping = {
  name: 'Company Name',
  website_url: 'Website',
  description: 'Description',
  founder_name: 'Founder',
  founder_email: 'Email',
  sector: 'Industry',
  ask_amount: 'Raise Amount',
  valuation: 'Valuation',
};

export function AddSourceDialog({ open, onOpenChange }: AddSourceDialogProps) {
  const { createSource } = useDealSources();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<'airtable' | 'gsheets'>('gsheets');

  // Airtable fields
  const [airtableName, setAirtableName] = useState('');
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [airtableTable, setAirtableTable] = useState('');

  // Google Sheets fields
  const [gsheetsName, setGsheetsName] = useState('');
  const [gsheetsUrl, setGsheetsUrl] = useState('');
  const [gsheetsSheet, setGsheetsSheet] = useState('Sheet1');

  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (sourceType === 'airtable') {
        const config: AirtableConfig = {
          baseId: airtableBaseId,
          tableName: airtableTable,
          fieldMapping: defaultFieldMapping,
        };
        await createSource(airtableName, 'airtable', config);
      } else {
        const config: GSheetsConfig = {
          sheetId: extractSheetId(gsheetsUrl),
          sheetName: gsheetsSheet,
          headerRow: 1,
          fieldMapping: defaultFieldMapping,
        };
        await createSource(gsheetsName, 'gsheets', config);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create source:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAirtableName('');
    setAirtableBaseId('');
    setAirtableTable('');
    setGsheetsName('');
    setGsheetsUrl('');
    setGsheetsSheet('Sheet1');
  };

  const isValid = sourceType === 'airtable'
    ? airtableName && airtableBaseId && airtableTable
    : gsheetsName && gsheetsUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Deal Source</DialogTitle>
          <DialogDescription>
            Connect an external source to automatically import deals into your pipeline.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as 'airtable' | 'gsheets')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gsheets" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="airtable" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Airtable
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gsheets" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Make sure your Google Sheet is shared as <strong>"Anyone with the link"</strong> with <strong>Viewer</strong> access for the sync to work.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="gsheets-name">Source Name</Label>
              <Input
                id="gsheets-name"
                placeholder="e.g., VC Deal Tracker"
                value={gsheetsName}
                onChange={(e) => setGsheetsName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsheets-url">Spreadsheet URL</Label>
              <Input
                id="gsheets-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={gsheetsUrl}
                onChange={(e) => setGsheetsUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste the full URL from your browser when viewing the spreadsheet
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsheets-sheet">Sheet Name (Tab)</Label>
              <Input
                id="gsheets-sheet"
                placeholder="Sheet1"
                value={gsheetsSheet}
                onChange={(e) => setGsheetsSheet(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The name of the tab at the bottom of your spreadsheet (default: Sheet1)
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Expected Column Headers</p>
              <p className="text-xs text-muted-foreground">
                Your spreadsheet should have these columns in the first row:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.values(defaultFieldMapping).map((header) => (
                  <span key={header} className="text-xs bg-background px-2 py-1 rounded border">
                    {header}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="airtable" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Requires an <strong>AIRTABLE_API_KEY</strong> configured in Settings → Integrations.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="airtable-name">Source Name</Label>
              <Input
                id="airtable-name"
                placeholder="e.g., Inbound Deals Base"
                value={airtableName}
                onChange={(e) => setAirtableName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airtable-base">Base ID</Label>
              <Input
                id="airtable-base"
                placeholder="appXXXXXXXXXXXXXX"
                value={airtableBaseId}
                onChange={(e) => setAirtableBaseId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Find this in your Airtable base URL: airtable.com/<strong>appXXX</strong>
                <a 
                  href="https://support.airtable.com/docs/finding-airtable-ids" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="airtable-table">Table Name</Label>
              <Input
                id="airtable-table"
                placeholder="e.g., Deals"
                value={airtableTable}
                onChange={(e) => setAirtableTable(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Connect Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
