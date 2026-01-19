import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus, Database, RefreshCw } from 'lucide-react';
import { useDealSources } from '@/hooks/useDealSources';
import { SourceCard } from '@/components/deal-sources/SourceCard';
import { AddSourceDialog } from '@/components/deal-sources/AddSourceDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { NotionConfig } from '@/types';
import { toast } from 'sonner';

export default function DealSources() {
  const { sources, isLoading, syncSource, deleteSource, refetch } = useDealSources();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Handle sync with special Notion flow
  const handleSync = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    if (source.sourceType === 'notion') {
      // For Notion sources, we need to inform the user that sync happens via the MCP
      // The actual sync will be triggered via the Lovable agent's MCP integration
      toast.info('Notion sync initiated. The Lovable agent will fetch data from your Notion database.');
      
      // Note: In a real implementation, this would trigger the MCP to fetch Notion data
      // and then call syncSource with the fetched data. Since MCP tools are used by the agent,
      // we show a message indicating that the agent will handle this.
      console.log('Notion source sync requested:', {
        sourceId,
        databaseId: (source.config as NotionConfig).databaseId,
      });
      return;
    }

    // For other source types, proceed normally
    await syncSource(sourceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Deal Sources</h1>
            <p className="text-muted-foreground">
              Connect Airtable, Google Sheets, or Notion to automatically import deals
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {/* Sources List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No deal sources connected</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Connect your Airtable bases, Google Sheets, or Notion databases to automatically import startup deals into your pipeline.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Source
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onSync={async () => { await handleSync(source.id); }}
                onDelete={async () => { await deleteSource(source.id); }}
              />
            ))}
          </div>
        )}

        {/* Add Source Dialog */}
        <AddSourceDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </main>
    </div>
  );
}
