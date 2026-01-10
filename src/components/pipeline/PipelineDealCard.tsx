import { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ExternalLink, Star, MoreVertical, Trash2, ArrowRight, FileText, CheckCircle, Sparkles, Loader2, Eye, TrendingUp } from 'lucide-react';
import { PipelineDeal, PipelineStage, STAGE_CONFIGS, TermSheet, DDReport } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TermSheetStatusBadge } from '@/components/term-sheets/TermSheetStatusBadge';
import { TermSheetGenerator } from '@/components/term-sheets/TermSheetGenerator';
import { FinalizeToPortfolioDialog } from '@/components/term-sheets/FinalizeToPortfolioDialog';
import { DDReportViewer } from './DDReportViewer';
import { useDDReport } from '@/hooks/useDDReport';

interface PipelineDealCardProps {
  deal: PipelineDeal;
  index: number;
  onDelete: (dealId: string) => void;
  onMoveToStage: (dealId: string, stage: PipelineStage) => void;
  onClick?: (deal: PipelineDeal) => void;
  termSheet?: TermSheet;
  onGenerateDD?: (dealId: string) => Promise<{ success: boolean; error?: string }>;
  isGeneratingDD?: boolean;
}

// Mini score badge component for inline DD display
function MiniScoreBadge({ label, score }: { label: string; score: number | null | undefined }) {
  if (score == null) return null;
  const getScoreColor = (s: number) => {
    if (s >= 4) return 'bg-green-500/20 text-green-600 border-green-500/30';
    if (s >= 3) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    return 'bg-red-500/20 text-red-600 border-red-500/30';
  };
  return (
    <div className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', getScoreColor(score))}>
      {label}: {score}/5
    </div>
  );
}

export function PipelineDealCard({
  deal,
  index,
  onDelete,
  onMoveToStage,
  onClick,
  termSheet,
  onGenerateDD,
  isGeneratingDD: externalGeneratingDD = false,
}: PipelineDealCardProps) {
  const [showTermSheetModal, setShowTermSheetModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [localGeneratingDD, setLocalGeneratingDD] = useState(false);
  const [showDDReport, setShowDDReport] = useState(false);
  const [ddReport, setDDReport] = useState<DDReport | null>(null);
  const { getDDReport, isLoading: isLoadingDD } = useDDReport();

  const isGeneratingDD = externalGeneratingDD || localGeneratingDD;

  // Fetch DD report when deal has a report ID
  useEffect(() => {
    if (deal.ddReportId && deal.stage === 'dd') {
      getDDReport(deal.ddReportId).then(report => {
        if (report) setDDReport(report);
      });
    }
  }, [deal.ddReportId, deal.stage]);

  const handleGenerateDD = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGenerateDD || isGeneratingDD) return;
    setLocalGeneratingDD(true);
    await onGenerateDD(deal.id);
    setLocalGeneratingDD(false);
  };

  const currentStageIndex = STAGE_CONFIGS.findIndex(s => s.key === deal.stage);
  const nextStage = STAGE_CONFIGS[currentStageIndex + 1];

  const getPriorityStars = (priority: number) => {
    const stars = 4 - priority; // 1=high=3 stars, 3=low=1 star
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          )}
        />
      ));
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getDaysInStage = () => {
    const days = Math.floor(
      (Date.now() - new Date(deal.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days === 0 ? 'Today' : `${days}d`;
  };

  const handleFinalize = () => {
    setShowTermSheetModal(false);
    setShowFinalizeModal(true);
  };

  return (
    <>
      <Draggable draggableId={deal.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              'bg-card border border-border rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing transition-all',
              snapshot.isDragging && 'shadow-lg rotate-2 scale-105',
              'hover:border-primary/30 hover:shadow-sm'
            )}
            onClick={() => onClick?.(deal)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{deal.name}</h4>
                  {deal.websiteUrl && (
                    <a
                      href={deal.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {deal.sector && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {deal.sector}
                    </Badge>
                  )}
                  <div className="flex">{getPriorityStars(deal.priority)}</div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {deal.stage === 'dd' && onGenerateDD && (
                    <>
                      {deal.ddReportId && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDDReport(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View DD Report
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleGenerateDD} disabled={isGeneratingDD}>
                        {isGeneratingDD ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingDD ? 'Generating...' : (deal.ddReportId ? 'Regenerate DD' : 'Generate DD Report')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {deal.stage === 'term_sheet' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowTermSheetModal(true); }}>
                        <FileText className="w-4 h-4 mr-2" />
                        {termSheet ? 'View Term Sheet' : 'Generate Term Sheet'}
                      </DropdownMenuItem>
                      {termSheet?.status === 'signed' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowFinalizeModal(true); }}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalize to Portfolio
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {nextStage && deal.stage !== 'closed' && deal.stage !== 'passed' && (
                    <DropdownMenuItem onClick={() => onMoveToStage(deal.id, nextStage.key)}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Move to {nextStage.label}
                    </DropdownMenuItem>
                  )}
                  {deal.stage !== 'passed' && (
                    <DropdownMenuItem onClick={() => onMoveToStage(deal.id, 'passed')}>
                      Pass
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(deal.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {deal.founderName && <span>{deal.founderName}</span>}
                {deal.askAmount && (
                  <span className="text-primary font-medium">
                    {formatCurrency(deal.askAmount)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {deal.stage === 'term_sheet' && termSheet && (
                  <TermSheetStatusBadge status={termSheet.status} />
                )}
                <span>{getDaysInStage()}</span>
              </div>
            </div>

            {/* Inline DD Section for deals in DD stage */}
            {deal.stage === 'dd' && (
              <div className="mt-3 pt-3 border-t border-border">
                {isGeneratingDD ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing deal...</span>
                  </div>
                ) : ddReport ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      <MiniScoreBadge label="Team" score={ddReport.scores?.team?.score} />
                      <MiniScoreBadge label="Market" score={ddReport.scores?.market?.score} />
                      <MiniScoreBadge label="Product" score={ddReport.scores?.product?.score} />
                      <MiniScoreBadge label="Moat" score={ddReport.scores?.moat?.score} />
                    </div>
                    {ddReport.investmentSuccessRate && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="font-medium text-foreground">
                          {ddReport.investmentSuccessRate.probability}% Success
                        </span>
                        <span className="text-muted-foreground">
                          ({ddReport.investmentSuccessRate.confidence} confidence)
                        </span>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs w-full mt-1"
                      onClick={(e) => { e.stopPropagation(); setShowDDReport(true); }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Full Report
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">DD Pending</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 text-xs"
                      onClick={handleGenerateDD}
                      disabled={!onGenerateDD}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Draggable>

      {showTermSheetModal && (
        <TermSheetGenerator
          open={showTermSheetModal}
          onOpenChange={setShowTermSheetModal}
          deal={deal}
          existingTermSheet={termSheet}
          onFinalize={handleFinalize}
        />
      )}

      {showFinalizeModal && (
        <FinalizeToPortfolioDialog
          open={showFinalizeModal}
          onOpenChange={setShowFinalizeModal}
          deal={deal}
          termSheet={termSheet}
        />
      )}

      {showDDReport && deal.ddReportId && (
        <DDReportViewer
          open={showDDReport}
          onOpenChange={setShowDDReport}
          reportId={deal.ddReportId}
          dealName={deal.name}
        />
      )}
    </>
  );
}
