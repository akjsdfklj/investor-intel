import { useState, useEffect } from 'react';
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
import { Table2, FileSpreadsheet, Loader2, ExternalLink, AlertCircle, CheckCircle2, Settings, BookOpen } from 'lucide-react';
import { useDealSources } from '@/hooks/useDealSources';
import { AirtableConfig, GSheetsConfig, NotionConfig, FieldMapping, DealSourceType } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

const notionDefaultFieldMapping: FieldMapping = {
  name: 'Name',
  website_url: 'Website',
  description: 'Description',
  founder_name: 'Founder',
  founder_email: 'Email',
  sector: 'Sector',
  ask_amount: 'Ask Amount',
  valuation: 'Valuation',
};

export function AddSourceDialog({ open, onOpenChange }: AddSourceDialogProps) {
  const { createSource } = useDealSources();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<DealSourceType>('gsheets');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Check Google connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const { data } = await supabase
          .from('google_oauth_tokens')
          .select('user_email')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setGoogleConnected(true);
          setGoogleEmail((data as { user_email: string }).user_email);
        } else {
          setGoogleConnected(false);
          setGoogleEmail(null);
        }
      } catch (error) {
        console.error('Failed to check Google connection:', error);
      }
    };

    if (open) {
      checkGoogleConnection();
    }
  }, [open]);

  // Airtable fields
  const [airtableName, setAirtableName] = useState('');
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [airtableTable, setAirtableTable] = useState('');

  // Google Sheets fields
  const [gsheetsName, setGsheetsName] = useState('');
  const [gsheetsUrl, setGsheetsUrl] = useState('');
  const [gsheetsSheet, setGsheetsSheet] = useState('Sheet1');

  // Notion fields
  const [notionName, setNotionName] = useState('');
  const [notionDatabaseUrl, setNotionDatabaseUrl] = useState('');
  const [notionFieldMapping, setNotionFieldMapping] = useState<FieldMapping>(notionDefaultFieldMapping);

  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const extractNotionDatabaseId = (url: string): string => {
    // Handle various Notion URL formats:
    // https://www.notion.so/workspace/Database-Name-abc123...
    // https://notion.so/abc123...
    // https://www.notion.so/abc123...?v=xyz
    const cleanUrl = url.split('?')[0]; // Remove query params
    const parts = cleanUrl.split('/');
    const lastPart = parts[parts.length - 1];
    
    // Extract the ID from the end of the last part (after the last hyphen if title is included)
    const match = lastPart.match(/([a-f0-9]{32}|[a-f0-9-]{36})$/i);
    if (match) {
      return match[1].replace(/-/g, '');
    }
    
    // Try to find UUID format
    const uuidMatch = url.match(/([a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12})/i);
    if (uuidMatch) {
      return uuidMatch[1].replace(/-/g, '');
    }
    
    return lastPart;
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
      } else if (sourceType === 'gsheets') {
        const config: GSheetsConfig = {
          sheetId: extractSheetId(gsheetsUrl),
          sheetName: gsheetsSheet,
          headerRow: 1,
          fieldMapping: defaultFieldMapping,
        };
        await createSource(gsheetsName, 'gsheets', config);
      } else if (sourceType === 'notion') {
        const config: NotionConfig = {
          databaseId: extractNotionDatabaseId(notionDatabaseUrl),
          databaseUrl: notionDatabaseUrl,
          fieldMapping: notionFieldMapping,
        };
        await createSource(notionName, 'notion', config);
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
    setNotionName('');
    setNotionDatabaseUrl('');
    setNotionFieldMapping(notionDefaultFieldMapping);
  };

  const isValid = 
    sourceType === 'airtable'
      ? airtableName && airtableBaseId && airtableTable
      : sourceType === 'gsheets'
        ? gsheetsName && gsheetsUrl
        : notionName && notionDatabaseUrl;

  const updateNotionFieldMapping = (field: keyof FieldMapping, value: string) => {
    setNotionFieldMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Deal Source</DialogTitle>
          <DialogDescription>
            Connect an external source to automatically import deals into your pipeline.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as DealSourceType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gsheets" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="airtable" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Airtable
            </TabsTrigger>
            <TabsTrigger value="notion" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Notion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gsheets" className="space-y-4 mt-4">
            {googleConnected ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Google Account Connected:</strong> {googleEmail}
                  <br />
                  <span className="text-sm">You can sync private sheets shared with this account, or public sheets.</span>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Public sheets only:</strong> Connect your Google account in{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/settings');
                    }}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Settings <Settings className="w-3 h-3" />
                  </button>
                  {' '}to access private sheets, or share as "Anyone with the link".
                </AlertDescription>
              </Alert>
            )}

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

          <TabsContent value="notion" className="space-y-4 mt-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Notion Connected</strong> via workspace integration.
                <br />
                <span className="text-sm">Paste your database URL below to import deals.</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="notion-name">Source Name</Label>
              <Input
                id="notion-name"
                placeholder="e.g., Deal Pipeline Database"
                value={notionName}
                onChange={(e) => setNotionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notion-url">Database URL</Label>
              <Input
                id="notion-url"
                placeholder="https://www.notion.so/workspace/Database-abc123..."
                value={notionDatabaseUrl}
                onChange={(e) => setNotionDatabaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Open your Notion database, click "Share", and copy the link
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <p className="text-sm font-medium">Field Mapping</p>
              <p className="text-xs text-muted-foreground">
                Enter the exact property names from your Notion database:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Company Name *</Label>
                  <Input
                    placeholder="Name"
                    className="h-8 text-sm"
                    value={notionFieldMapping.name || ''}
                    onChange={(e) => updateNotionFieldMapping('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Website</Label>
                  <Input
                    placeholder="Website"
                    className="h-8 text-sm"
                    value={notionFieldMapping.website_url || ''}
                    onChange={(e) => updateNotionFieldMapping('website_url', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Description"
                    className="h-8 text-sm"
                    value={notionFieldMapping.description || ''}
                    onChange={(e) => updateNotionFieldMapping('description', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Founder Name</Label>
                  <Input
                    placeholder="Founder"
                    className="h-8 text-sm"
                    value={notionFieldMapping.founder_name || ''}
                    onChange={(e) => updateNotionFieldMapping('founder_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Founder Email</Label>
                  <Input
                    placeholder="Email"
                    className="h-8 text-sm"
                    value={notionFieldMapping.founder_email || ''}
                    onChange={(e) => updateNotionFieldMapping('founder_email', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sector</Label>
                  <Input
                    placeholder="Sector"
                    className="h-8 text-sm"
                    value={notionFieldMapping.sector || ''}
                    onChange={(e) => updateNotionFieldMapping('sector', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ask Amount</Label>
                  <Input
                    placeholder="Ask Amount"
                    className="h-8 text-sm"
                    value={notionFieldMapping.ask_amount || ''}
                    onChange={(e) => updateNotionFieldMapping('ask_amount', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valuation</Label>
                  <Input
                    placeholder="Valuation"
                    className="h-8 text-sm"
                    value={notionFieldMapping.valuation || ''}
                    onChange={(e) => updateNotionFieldMapping('valuation', e.target.value)}
                  />
                </div>
              </div>
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
