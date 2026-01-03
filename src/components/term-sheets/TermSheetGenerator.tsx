import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PipelineDeal, TermSheetTemplate, TermSheet } from '@/types';
import { useTermSheets } from '@/hooks/useTermSheets';
import { Loader2, FileText, Send, Download, CheckCircle } from 'lucide-react';
import { TermSheetStatusBadge } from './TermSheetStatusBadge';
import { format } from 'date-fns';

interface TermSheetGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: PipelineDeal;
  existingTermSheet?: TermSheet;
  onFinalize?: () => void;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export function TermSheetGenerator({ open, onOpenChange, deal, existingTermSheet, onFinalize }: TermSheetGeneratorProps) {
  const { createTermSheet, updateTermSheet, sendTermSheet, markAsSigned } = useTermSheets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [formData, setFormData] = useState({
    templateType: existingTermSheet?.templateType || 'safe' as TermSheetTemplate,
    investmentAmount: existingTermSheet?.investmentAmount || deal.askAmount || 0,
    valuationCap: existingTermSheet?.valuationCap || deal.valuation || 0,
    discountRate: existingTermSheet?.discountRate || 20,
    proRataRights: existingTermSheet?.proRataRights ?? true,
    recipientEmail: existingTermSheet?.recipientEmail || deal.founderEmail || '',
  });

  const handleCreate = async () => {
    setIsLoading(true);
    await createTermSheet({
      dealId: deal.id,
      templateType: formData.templateType,
      investmentAmount: formData.investmentAmount,
      valuationCap: formData.valuationCap,
      discountRate: formData.discountRate,
      proRataRights: formData.proRataRights,
      recipientEmail: formData.recipientEmail,
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
      recipientEmail: formData.recipientEmail,
    });
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!existingTermSheet) return;
    setIsSending(true);
    await sendTermSheet(existingTermSheet.id);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingTermSheet ? 'Term Sheet' : 'Generate Term Sheet'}
            {existingTermSheet && (
              <TermSheetStatusBadge status={existingTermSheet.status} className="ml-2" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{deal.name}</p>
            {deal.sector && <p className="text-sm text-muted-foreground">{deal.sector}</p>}
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Template Type</Label>
              <Select
                value={formData.templateType}
                onValueChange={(v) => setFormData({ ...formData, templateType: v as TermSheetTemplate })}
                disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe">SAFE (Simple Agreement for Future Equity)</SelectItem>
                  <SelectItem value="convertible_note">Convertible Note</SelectItem>
                  <SelectItem value="equity">Priced Equity Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Investment Amount</Label>
                <Input
                  type="number"
                  value={formData.investmentAmount}
                  onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                  disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
                />
              </div>
              <div className="space-y-2">
                <Label>Valuation Cap</Label>
                <Input
                  type="number"
                  value={formData.valuationCap}
                  onChange={(e) => setFormData({ ...formData, valuationCap: Number(e.target.value) })}
                  disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
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
                    disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pro-Rata Rights</Label>
                  <div className="flex items-center h-10">
                    <Switch
                      checked={formData.proRataRights}
                      onCheckedChange={(v) => setFormData({ ...formData, proRataRights: v })}
                      disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
                    />
                    <span className="ml-2 text-sm">{formData.proRataRights ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                placeholder="founder@startup.com"
                disabled={existingTermSheet?.status === 'sent' || existingTermSheet?.status === 'signed'}
              />
            </div>

            {existingTermSheet && (
              <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                <p>Created: {format(new Date(existingTermSheet.createdAt), 'PPp')}</p>
                {existingTermSheet.sentAt && <p>Sent: {format(new Date(existingTermSheet.sentAt), 'PPp')}</p>}
                {existingTermSheet.openedAt && <p>Viewed: {format(new Date(existingTermSheet.openedAt), 'PPp')}</p>}
                {existingTermSheet.signedAt && <p>Signed: {format(new Date(existingTermSheet.signedAt), 'PPp')}</p>}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!existingTermSheet ? (
            <Button onClick={handleCreate} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate Term Sheet
            </Button>
          ) : existingTermSheet.status === 'draft' ? (
            <>
              <Button variant="outline" onClick={handleUpdate} disabled={isLoading}>
                Save Changes
              </Button>
              <Button onClick={handleSend} disabled={isSending || !formData.recipientEmail}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
