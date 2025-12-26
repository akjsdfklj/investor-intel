import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Link, FileText, X, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadedItem {
  id: string;
  name: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
}

interface BulkUploadZoneProps {
  onUpload: (items: UploadedItem[]) => void;
  maxItems?: number;
  isProcessing?: boolean;
}

export function BulkUploadZone({ 
  onUpload, 
  maxItems = 10,
  isProcessing = false 
}: BulkUploadZoneProps) {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length !== fileArray.length) {
      toast({
        title: "Invalid files",
        description: "Only PDF files are accepted",
        variant: "destructive"
      });
    }

    const remainingSlots = maxItems - items.length;
    const filesToAdd = pdfFiles.slice(0, remainingSlots);

    if (pdfFiles.length > remainingSlots) {
      toast({
        title: "Limit reached",
        description: `Maximum ${maxItems} files allowed. Only first ${remainingSlots} files added.`,
        variant: "destructive"
      });
    }

    const newItems: UploadedItem[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      name: file.name.replace('.pdf', ''),
      type: 'file',
      file
    }));

    setItems(prev => [...prev, ...newItems]);
  }, [items.length, maxItems, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleAddUrls = () => {
    const urls = urlInput
      .split(/[\n,]/)
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));
    
    if (urls.length === 0) {
      toast({
        title: "Invalid URLs",
        description: "Please enter valid HTTP/HTTPS URLs",
        variant: "destructive"
      });
      return;
    }

    const remainingSlots = maxItems - items.length;
    const urlsToAdd = urls.slice(0, remainingSlots);

    const newItems: UploadedItem[] = urlsToAdd.map(url => {
      const urlObj = new URL(url);
      const name = urlObj.pathname.split('/').pop()?.replace('.pdf', '') || urlObj.hostname;
      return {
        id: crypto.randomUUID(),
        name,
        type: 'url',
        url
      };
    });

    setItems(prev => [...prev, ...newItems]);
    setUrlInput('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast({
        title: "No files",
        description: "Please add at least one pitch deck",
        variant: "destructive"
      });
      return;
    }
    onUpload(items);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="urls" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Paste URLs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Drop pitch decks here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (PDF only, max {maxItems} files)
              </p>
              <Badge variant="secondary">
                {items.length} / {maxItems} files
              </Badge>
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </TabsContent>

        <TabsContent value="urls" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                placeholder="Paste PDF URLs here (one per line or comma-separated)&#10;https://example.com/deck1.pdf&#10;https://example.com/deck2.pdf"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={5}
                disabled={isProcessing}
              />
              <Button 
                className="mt-4 w-full"
                onClick={handleAddUrls}
                disabled={!urlInput.trim() || isProcessing}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add URLs ({items.length}/{maxItems})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Items */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Selected Pitch Decks ({items.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(item => (
              <Card key={item.id} className="relative group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.type === 'file' ? (
                      <FileText className="w-5 h-5 text-primary" />
                    ) : (
                      <Link className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'file' ? 'PDF File' : 'URL'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeItem(item.id)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Analysis may take a few minutes per deck</span>
        </div>
        <Button 
          size="lg"
          onClick={handleSubmit}
          disabled={items.length === 0 || isProcessing}
          className="px-8"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              Analyze {items.length} Startup{items.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
