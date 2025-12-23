import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PitchDeckUpload } from '@/components/PitchDeckUpload';
import { Loader2, Building2 } from 'lucide-react';

interface CreateDealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; url?: string; description?: string; pitchDeckUrl?: string; pitchDeckContent?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateDealForm({ open, onOpenChange, onSubmit, isSubmitting }: CreateDealFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [pitchDeckContent, setPitchDeckContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, url: url || undefined, description: description || undefined, pitchDeckUrl: pitchDeckUrl || undefined, pitchDeckContent: pitchDeckContent || undefined });
    setName(''); setUrl(''); setDescription(''); setPitchDeckUrl(''); setPitchDeckContent('');
  };

  const handlePitchDeckUpload = (uploadedUrl: string, content: string) => {
    setPitchDeckUrl(uploadedUrl);
    setPitchDeckContent(content);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl">Add New Deal</DialogTitle>
          <DialogDescription>Enter the startup details and upload pitch deck for analysis</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="deal-name">Startup Name <span className="text-destructive">*</span></Label>
            <Input id="deal-name" placeholder="e.g., Acme Corp" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-url">Website URL</Label>
            <Input id="deal-url" type="text" placeholder="e.g., acme.com" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-description">Brief Description</Label>
            <Textarea id="deal-description" placeholder="What does this company do?" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Pitch Deck (Optional)</Label>
            <PitchDeckUpload onUpload={handlePitchDeckUpload} currentUrl={pitchDeckUrl} disabled={isSubmitting} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()} className="flex-1 gradient-primary text-primary-foreground hover:opacity-90">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
