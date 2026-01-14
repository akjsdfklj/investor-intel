import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PipelineDeal, TermSheetTemplate, TermSheet } from '@/types';
import { useTermSheets } from '@/hooks/useTermSheets';
import { Loader2, FileText, Send, CheckCircle, Settings, Edit2, X, Paperclip, Upload } from 'lucide-react';
import { TermSheetStatusBadge } from './TermSheetStatusBadge';
import { TermSheetEditor } from './TermSheetEditor';
import { generateTermSheetContent, getTemplateDescription } from '@/lib/termSheetTemplates';
import { format } from 'date-fns';

interface TermSheetGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: PipelineDeal;
  existingTermSheet?: TermSheet;
  onFinalize?: () => void;
}

export function TermSheetGenerator({ open, onOpenChange, deal, existingTermSheet, onFinalize }: TermSheetGeneratorProps) {
  const { createTermSheet, updateTermSheet, sendTermSheet, markAsSigned } = useTermSheets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'document'>('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    templateType: existingTermSheet?.templateType || 'safe' as TermSheetTemplate,
    investmentAmount: existingTermSheet?.investmentAmount || deal?.askAmount || 0,
    valuationCap: existingTermSheet?.valuationCap || deal?.valuation || 0,
    discountRate: existingTermSheet?.discountRate || 20,
    proRataRights: existingTermSheet?.proRataRights ?? true,
    recipientEmail: existingTermSheet?.recipientEmail || deal?.founderEmail || '',
  });

  // Email recipients state
  const [toEmails, setToEmails] = useState<string[]>([formData.recipientEmail].filter(Boolean));
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newToEmail, setNewToEmail] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');

  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null);

  const [documentContent, setDocumentContent] = useState('');

  // Generate document content when form changes
  useEffect(() => {
    if (!deal) return;
    const content = generateTermSheetContent(formData.templateType, {
      companyName: deal.name,
      investorName: '[YOUR FUND NAME]',
      investmentAmount: formData.investmentAmount,
      valuationCap: formData.valuationCap,
      discountRate: formData.discountRate,
      proRataRights: formData.proRataRights,
      founderName: deal.founderName,
      founderEmail: deal.founderEmail,
      date: format(new Date(), 'MMMM d, yyyy'),
    });
    setDocumentContent(content);
  }, [formData, deal]);

  // Sync toEmails when recipientEmail changes
  useEffect(() => {
    if (formData.recipientEmail && !toEmails.includes(formData.recipientEmail)) {
      setToEmails([formData.recipientEmail]);
    }
  }, [formData.recipientEmail]);

  const isReadOnly = existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed';

  const addToEmail = () => {
    const email = newToEmail.trim();
    if (email && !toEmails.includes(email) && email.includes('@')) {
      setToEmails([...toEmails, email]);
      setNewToEmail('');
      // Update formData with first email as primary
      if (toEmails.length === 0) {
        setFormData({ ...formData, recipientEmail: email });
      }
    }
  };

  const removeToEmail = (email: string) => {
    const newList = toEmails.filter(e => e !== email);
    setToEmails(newList);
    // Update formData with first remaining email
    setFormData({ ...formData, recipientEmail: newList[0] || '' });
  };

  const addCcEmail = () => {
    const email = newCcEmail.trim();
    if (email && !ccEmails.includes(email) && email.includes('@')) {
      setCcEmails([...ccEmails, email]);
      setNewCcEmail('');
    }
  };

  const removeCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
    }
  };

  const handleCreate = async () => {
    setIsLoading(true);
    await createTermSheet({
      dealId: deal.id,
      templateType: formData.templateType,
      investmentAmount: formData.investmentAmount,
      valuationCap: formData.valuationCap,
      discountRate: formData.discountRate,
      proRataRights: formData.proRataRights,
      recipientEmail: toEmails[0] || formData.recipientEmail,
    });
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleUpdate = async () => {
    if (!existingTermSheet) return;
    setIsLoading(true);
    await updateTermSheet(existingTermSheet.id, {
      templateType: formData.templateType,
      investmentAmount: formData.investmentAmount,
      valuationCap: formData.valuationCap,
      discountRate: formData.discountRate,
      proRataRights: formData.proRataRights,
      recipientEmail: toEmails[0] || formData.recipientEmail,
    });
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!existingTermSheet) return;
    if (toEmails.length === 0) {
      alert('Please add at least one recipient email');
      return;
    }
    
    setIsSending(true);
    
    // Convert attachment to base64 if present
    let attachmentData: { name: string; content: string; type: string } | undefined;
    if (attachment) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:...;base64, prefix
        };
        reader.readAsDataURL(attachment);
      });
      attachmentData = {
        name: attachment.name,
        content: base64,
        type: attachment.type,
      };
    }
    
    await sendTermSheet(existingTermSheet.id, toEmails, ccEmails, attachmentData);
    setIsSending(false);
  };

  const handleMarkSigned = async () => {
    if (!existingTermSheet) return;
    setIsLoading(true);
    await markAsSigned(existingTermSheet.id);
    setIsLoading(false);
  };

  const handleFinalize = () => {
    onFinalize?.();
    onOpenChange(false);
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingTermSheet ? 'Term Sheet' : 'Generate Term Sheet'} - {deal.name}
            {existingTermSheet && (
              <TermSheetStatusBadge status={existingTermSheet.status} className="ml-2" />
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 self-start">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-2">
              <Edit2 className="w-4 h-4" />
              Document
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="flex-1 overflow-auto px-6 pb-6 mt-4">
            <div className="max-w-lg space-y-6">
              {/* Deal Info */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{deal.name}</p>
                {deal.sector && <p className="text-sm text-muted-foreground">{deal.sector}</p>}
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select
                  value={formData.templateType}
                  onValueChange={(v) => setFormData({ ...formData, templateType: v as TermSheetTemplate })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">SAFE</SelectItem>
                    <SelectItem value="convertible_note">Convertible Note</SelectItem>
                    <SelectItem value="equity">Priced Equity Round</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getTemplateDescription(formData.templateType)}
                </p>
              </div>

              {/* Investment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment Amount ($)</Label>
                  <Input
                    type="number"
                    value={formData.investmentAmount}
                    onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valuation Cap ($)</Label>
                  <Input
                    type="number"
                    value={formData.valuationCap}
                    onChange={(e) => setFormData({ ...formData, valuationCap: Number(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              {(formData.templateType === 'safe' || formData.templateType === 'convertible_note') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Rate (%)</Label>
                    <Input
                      type="number"
                      value={formData.discountRate}
                      onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pro-Rata Rights</Label>
                    <div className="flex items-center h-10">
                      <Switch
                        checked={formData.proRataRights}
                        onCheckedChange={(v) => setFormData({ ...formData, proRataRights: v })}
                        disabled={isReadOnly}
                      />
                      <span className="ml-2 text-sm">{formData.proRataRights ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipients Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Email Recipients
                </h3>
                
                {/* To Emails */}
                <div className="space-y-2">
                  <Label>To (Recipients)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {toEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        {!isReadOnly && (
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeToEmail(email)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newToEmail}
                        onChange={(e) => setNewToEmail(e.target.value)}
                        placeholder="Add recipient email"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToEmail())}
                      />
                      <Button type="button" variant="outline" onClick={addToEmail}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* CC Emails */}
                <div className="space-y-2">
                  <Label>CC (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ccEmails.map((email) => (
                      <Badge key={email} variant="outline" className="gap-1">
                        {email}
                        {!isReadOnly && (
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeCcEmail(email)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        placeholder="Add CC email"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCcEmail())}
                      />
                      <Button type="button" variant="outline" onClick={addCcEmail}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* Attachment */}
                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      disabled={isReadOnly}
                    />
                    {attachment ? (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md flex-1">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{attachment.name}</span>
                        {!isReadOnly && (
                          <X
                            className="w-4 h-4 cursor-pointer hover:text-destructive"
                            onClick={() => setAttachment(null)}
                          />
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadOnly}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or Excel files up to 10MB
                  </p>
                </div>
              </div>

              {/* Status Info */}
              {existingTermSheet && (
                <div className="border-t pt-4 space-y-1 text-sm text-muted-foreground">
                  <p>Created: {format(new Date(existingTermSheet.createdAt), 'PPp')}</p>
                  {existingTermSheet.sentAt && <p>Sent: {format(new Date(existingTermSheet.sentAt), 'PPp')}</p>}
                  {existingTermSheet.signedAt && <p>Signed: {format(new Date(existingTermSheet.signedAt), 'PPp')}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {!existingTermSheet ? (
                  <Button onClick={handleCreate} disabled={isLoading} className="flex-1">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Generate Term Sheet
                  </Button>
                ) : existingTermSheet.status === 'draft' ? (
                  <>
                    <Button variant="outline" onClick={handleUpdate} disabled={isLoading}>
                      Save Changes
                    </Button>
                    <Button onClick={handleSend} disabled={isSending || toEmails.length === 0}>
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Send to Founder
                    </Button>
                  </>
                ) : existingTermSheet.status === 'sent' || existingTermSheet.status === 'opened' ? (
                  <>
                    <Button variant="outline" onClick={handleSend} disabled={isSending}>
                      <Send className="w-4 h-4 mr-2" />
                      Resend
                    </Button>
                    <Button onClick={handleMarkSigned} disabled={isLoading}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Signed
                    </Button>
                  </>
                ) : existingTermSheet.status === 'signed' ? (
                  <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalize to Portfolio
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="document" className="flex-1 overflow-hidden m-0">
            <TermSheetEditor
              content={documentContent}
              onChange={setDocumentContent}
              onSave={existingTermSheet?.status === 'draft' ? handleUpdate : undefined}
              isSaving={isLoading}
              readOnly={isReadOnly}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
