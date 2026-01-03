import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPIPeriodType } from '@/types';
import { usePortfolioKPIs } from '@/hooks/usePortfolioKPIs';
import { Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface KPIEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function KPIEntryForm({ open, onOpenChange, companyId }: KPIEntryFormProps) {
  const { createKPI } = usePortfolioKPIs(companyId);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    periodType: 'monthly' as KPIPeriodType,
    periodDate: format(new Date(), 'yyyy-MM-dd'),
    revenue: '',
    mrr: '',
    arr: '',
    customers: '',
    burnRate: '',
    runwayMonths: '',
    churnRate: '',
    headcount: '',
    npsScore: '',
    notes: '',
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    
    await createKPI({
      companyId,
      periodType: formData.periodType,
      periodDate: formData.periodDate,
      revenue: formData.revenue ? Number(formData.revenue) : undefined,
      mrr: formData.mrr ? Number(formData.mrr) : undefined,
      arr: formData.arr ? Number(formData.arr) : undefined,
      customers: formData.customers ? Number(formData.customers) : undefined,
      burnRate: formData.burnRate ? Number(formData.burnRate) : undefined,
      runwayMonths: formData.runwayMonths ? Number(formData.runwayMonths) : undefined,
      churnRate: formData.churnRate ? Number(formData.churnRate) : undefined,
      headcount: formData.headcount ? Number(formData.headcount) : undefined,
      npsScore: formData.npsScore ? Number(formData.npsScore) : undefined,
      notes: formData.notes || undefined,
    });

    setIsLoading(false);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      periodType: 'monthly',
      periodDate: format(new Date(), 'yyyy-MM-dd'),
      revenue: '',
      mrr: '',
      arr: '',
      customers: '',
      burnRate: '',
      runwayMonths: '',
      churnRate: '',
      headcount: '',
      npsScore: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add KPI Entry
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select
                value={formData.periodType}
                onValueChange={(v) => setFormData({ ...formData, periodType: v as KPIPeriodType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period Date</Label>
              <Input
                type="date"
                value={formData.periodDate}
                onChange={(e) => setFormData({ ...formData, periodDate: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Revenue Metrics</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Revenue ($)</Label>
                <Input
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">MRR ($)</Label>
                <Input
                  type="number"
                  value={formData.mrr}
                  onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">ARR ($)</Label>
                <Input
                  type="number"
                  value={formData.arr}
                  onChange={(e) => setFormData({ ...formData, arr: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Growth Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Customers</Label>
                <Input
                  type="number"
                  value={formData.customers}
                  onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Churn Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.churnRate}
                  onChange={(e) => setFormData({ ...formData, churnRate: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Operations</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Burn Rate ($/mo)</Label>
                <Input
                  type="number"
                  value={formData.burnRate}
                  onChange={(e) => setFormData({ ...formData, burnRate: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Runway (months)</Label>
                <Input
                  type="number"
                  value={formData.runwayMonths}
                  onChange={(e) => setFormData({ ...formData, runwayMonths: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Headcount</Label>
                <Input
                  type="number"
                  value={formData.headcount}
                  onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">NPS Score</Label>
            <Input
              type="number"
              min="-100"
              max="100"
              value={formData.npsScore}
              onChange={(e) => setFormData({ ...formData, npsScore: e.target.value })}
              placeholder="-100 to 100"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Key updates, highlights, concerns..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Add KPI Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
