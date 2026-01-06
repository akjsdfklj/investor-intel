import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { PipelineDeal, TermSheetTemplate, AITermSheetRecommendation } from '@/types';
import { useTermSheets } from '@/hooks/useTermSheets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AITermSheetWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: PipelineDeal[];
}

export function AITermSheetWizard({ open, onOpenChange, deals }: AITermSheetWizardProps) {
  const { createTermSheet } = useTermSheets();
  const [step, setStep] = useState(1);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AITermSheetRecommendation | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [templateType, setTemplateType] = useState<TermSheetTemplate>('safe');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [valuationCap, setValuationCap] = useState('');
  const [discountRate, setDiscountRate] = useState('20');
  const [proRataRights, setProRataRights] = useState(true);

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  const handleAnalyze = async () => {
    if (!selectedDealId) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-term-sheet-analysis', {
        body: { dealId: selectedDealId },
      });

      if (error) throw error;

      setRecommendations(data as AITermSheetRecommendation);

      // Pre-fill form with AI recommendations
      setTemplateType(data.suggestedTemplate);
      setDiscountRate(String(data.suggestedDiscount));
      if (data.valuationRange) {
        setValuationCap(String(Math.round((data.valuationRange.min + data.valuationRange.max) / 2)));
      }

      setStep(2);
    } catch (error) {
      console.error('Error analyzing deal:', error);
      toast.error('Failed to analyze deal. Using default recommendations.');
      // Set default recommendations
      setRecommendations({
        suggestedTemplate: 'safe',
        templateReason: 'SAFE is the standard for early-stage investments.',
        valuationRange: { min: 5000000, max: 10000000 },
        suggestedDiscount: 20,
        suggestedClauses: [
          { clause: 'Pro-rata rights', reason: 'Standard investor protection', priority: 'recommended' },
          { clause: 'Information rights', reason: 'Quarterly reporting', priority: 'recommended' },
        ],
        riskFactors: [],
        comparableDeals: [],
      });
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedDealId) return;

    setIsCreating(true);
    try {
      await createTermSheet({
        dealId: selectedDealId,
        templateType,
        investmentAmount: parseFloat(investmentAmount) || 0,
        valuationCap: parseFloat(valuationCap) || 0,
        discountRate: parseFloat(discountRate) || 20,
        proRataRights,
      });
      toast.success('Term sheet created successfully');
      onOpenChange(false);
      resetWizard();
    } catch (error) {
      console.error('Error creating term sheet:', error);
      toast.error('Failed to create term sheet');
    } finally {
      setIsCreating(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedDealId('');
    setRecommendations(null);
    setTemplateType('safe');
    setInvestmentAmount('');
    setValuationCap('');
    setDiscountRate('20');
    setProRataRights(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetWizard(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Term Sheet Generator
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Select a deal to generate an AI-powered term sheet.'}
            {step === 2 && 'Review AI recommendations and customize your term sheet.'}
            {step === 3 && 'Finalize and create your term sheet.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Deal */}
        {step === 1 && (
          <div className="space-y-4">
            <Label>Select a Deal</Label>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No deals in Term Sheet or IC Review stage. Move a deal to one of these stages first.
              </p>
            ) : (
              <RadioGroup value={selectedDealId} onValueChange={setSelectedDealId}>
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDealId === deal.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDealId(deal.id)}
                  >
                    <RadioGroupItem value={deal.id} id={deal.id} />
                    <div className="flex-1">
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.sector || 'No sector'} • Ask: ${((deal.askAmount || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        {/* Step 2: AI Recommendations */}
        {step === 2 && recommendations && (
          <div className="space-y-6">
            {/* AI Recommendation Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">AI Recommendation</p>
                    <p className="text-sm text-muted-foreground">
                      {recommendations.templateReason}
                    </p>
                    {recommendations.valuationRange && (
                      <p className="text-sm mt-2">
                        Suggested valuation: ${(recommendations.valuationRange.min / 1000000).toFixed(1)}M - ${(recommendations.valuationRange.max / 1000000).toFixed(1)}M
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template Type</Label>
              <RadioGroup value={templateType} onValueChange={(v) => setTemplateType(v as TermSheetTemplate)}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'safe', label: 'SAFE' },
                    { value: 'convertible_note', label: 'Convertible Note' },
                    { value: 'equity', label: 'Equity' },
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        templateType === option.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setTemplateType(option.value as TermSheetTemplate)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="text-sm font-medium">{option.label}</span>
                      {recommendations.suggestedTemplate === option.value && (
                        <Badge variant="secondary" className="ml-2 text-xs">AI Pick</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Suggested Clauses */}
            {recommendations.suggestedClauses.length > 0 && (
              <div className="space-y-2">
                <Label>Suggested Clauses</Label>
                <div className="space-y-2">
                  {recommendations.suggestedClauses.map((clause, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{clause.clause}</p>
                        <p className="text-xs text-muted-foreground">{clause.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Finalize */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investment">Investment Amount ($)</Label>
                <Input
                  id="investment"
                  type="number"
                  placeholder="250000"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valuation">Valuation Cap ($)</Label>
                <Input
                  id="valuation"
                  type="number"
                  placeholder="10000000"
                  value={valuationCap}
                  onChange={(e) => setValuationCap(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount Rate (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="20"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="prorata"
                  checked={proRataRights}
                  onCheckedChange={(checked) => setProRataRights(checked as boolean)}
                />
                <Label htmlFor="prorata">Pro-rata Rights</Label>
              </div>
            </div>

            {selectedDeal && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Summary</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Deal: {selectedDeal.name}</p>
                    <p>Template: {templateType.replace('_', ' ')}</p>
                    <p>Investment: ${parseFloat(investmentAmount || '0').toLocaleString()}</p>
                    <p>Valuation Cap: ${parseFloat(valuationCap || '0').toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step === 1 && (
            <Button onClick={handleAnalyze} disabled={!selectedDealId || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => setStep(3)}>
              Customize Terms
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleCreate} disabled={isCreating || !investmentAmount || !valuationCap}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Term Sheet
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
