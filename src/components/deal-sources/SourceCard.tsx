import { DealSource, GSheetsConfig, AirtableConfig, NotionConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, MoreVertical, Trash2, ExternalLink, Table2, FileSpreadsheet, BookOpen, CheckCircle2, XCircle, Clock, Loader2, Settings2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { FieldMappingDialog } from './FieldMappingDialog';

interface SourceCardProps {
  source: DealSource;
  onSync: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SourceCard({ source, onSync, onDelete }: SourceCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = () => {
    if (isSyncing) {
      return (
        <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Syncing...
        </Badge>
      );
    }
    
    switch (source.syncStatus) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Syncing...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Not synced
          </Badge>
        );
    }
  };

  const getSourceIcon = () => {
    switch (source.sourceType) {
      case 'airtable':
        return Table2;
      case 'notion':
        return BookOpen;
      default:
        return FileSpreadsheet;
    }
  };

  const SourceIcon = getSourceIcon();

  // Get source URL for external link
  const getSourceUrl = () => {
    if (source.sourceType === 'gsheets') {
      const config = source.config as GSheetsConfig;
      return `https://docs.google.com/spreadsheets/d/${config.sheetId}`;
    } else if (source.sourceType === 'notion') {
      const config = source.config as NotionConfig;
      return config.databaseUrl;
    } else {
      const config = source.config as AirtableConfig;
      return `https://airtable.com/${config.baseId}`;
    }
  };

  const getSourceDetails = () => {
    if (source.sourceType === 'gsheets') {
      const config = source.config as GSheetsConfig;
      return `Sheet: ${config.sheetName || 'Sheet1'}`;
    } else if (source.sourceType === 'notion') {
      const config = source.config as NotionConfig;
      return `Database ID: ${config.databaseId.slice(0, 8)}...`;
    } else {
      const config = source.config as AirtableConfig;
      return `Table: ${config.tableName}`;
    }
  };

  const getSourceTypeName = () => {
    switch (source.sourceType) {
      case 'airtable':
        return 'Airtable';
      case 'notion':
        return 'Notion';
      default:
        return 'Google Sheets';
    }
  };

  const handleOpenSource = () => {
    const url = getSourceUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <SourceIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{source.name}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground capitalize">
                  {getSourceTypeName()}
                </p>
                <span className="text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">{getSourceDetails()}</p>
              </div>
              {source.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced {formatDistanceToNow(new Date(source.lastSyncAt), { addSuffix: true })}
                </p>
              )}
              {!source.lastSyncAt && source.syncStatus === 'pending' && (
                <p className="text-xs text-muted-foreground">
                  Never synced - click "Sync Now" to import deals
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || source.syncStatus === 'syncing'}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenSource}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in {getSourceTypeName()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
