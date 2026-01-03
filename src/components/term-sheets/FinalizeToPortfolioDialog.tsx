import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PipelineDeal, TermSheet } from '@/types';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePipelineDeals } from '@/hooks/usePipelineDeals';
import { Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface FinalizeToPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: PipelineDeal;
  termSheet?: TermSheet;
}

export function FinalizeToPortfolioDialog({ open, onOpenChange, deal, termSheet }: FinalizeToPortfolioDialogProps) {
  const navigate = useNavigate();
  const { createCompany } = usePortfolio();
  const { updateDealStage } = usePipelineDeals();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    investmentAmount: termSheet?.investmentAmount || deal.askAmount || 0,
    valuationAtInvestment: termSheet?.valuationCap || deal.valuation || 0,
    ownershipPercentage: termSheet?.investmentAmount && termSheet?.valuationCap 
      ? (termSheet.investmentAmount / termSheet.valuationCap) * 100 
      : 0,
    investmentDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleFinalize = async () => {
    setIsLoading(true);

    // Create portfolio company
    const company = await createCompany({
      dealId: deal.id,
      name: deal.name,
      sector: deal.sector,
      websiteUrl: deal.websiteUrl,
      founderName: deal.founderName,
      founderEmail: deal.founderEmail,
      investmentDate: formData.investmentDate,
      investmentAmount: formData.investmentAmount,
      ownershipPercentage: formData.ownershipPercentage,
      valuationAtInvestment: formData.valuationAtInvestment,
      notes: formData.notes,
    });

    if (company) {
      // Move deal to closed stage
      await updateDealStage(deal.id, 'closed');
      onOpenChange(false);
      navigate(`/portfolio/${company.id}`);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Finalize to Portfolio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="font-medium text-green-900 dark:text-green-100">{deal.name}</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Moving this deal to your portfolio
            </p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Investment Date</Label>
              <Input
                type="date"
                value={formData.investmentDate}
                onChange={(e) => setFormData({ ...formData, investmentDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Investment Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.investmentAmount}
                  onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valuation ($)</Label>
                <Input
                  type="number"
                  value={formData.valuationAtInvestment}
                  onChange={(e) => setFormData({ ...formData, valuationAtInvestment: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ownership Percentage (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.ownershipPercentage}
                onChange={(e) => setFormData({ ...formData, ownershipPercentage: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Investment thesis, key terms, etc."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleFinalize} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Add to Portfolio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
