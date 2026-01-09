import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Printer, Download, Edit2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TermSheetEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function TermSheetEditor({
  content,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
  className,
}: TermSheetEditorProps) {
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (value: string) => {
    setLocalContent(value);
    onChange(value);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Term Sheet</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 11pt;
              line-height: 1.5;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              white-space: pre-wrap;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>${localContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'term-sheet.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Document Area */}
      <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900 p-6">
        <div className="h-full max-w-4xl mx-auto bg-white dark:bg-zinc-800 shadow-lg rounded-sm overflow-hidden">
          {isEditing ? (
            <Textarea
              value={localContent}
              onChange={(e) => handleChange(e.target.value)}
              className="h-full w-full resize-none border-0 rounded-none font-mono text-sm leading-relaxed p-8 focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-zinc-800"
              placeholder="Start typing your term sheet..."
            />
          ) : (
            <div className="h-full overflow-auto p-8">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {localContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
