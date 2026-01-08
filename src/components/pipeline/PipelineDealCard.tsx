import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ExternalLink, Star, MoreVertical, Trash2, ArrowRight, FileText, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { PipelineDeal, PipelineStage, STAGE_CONFIGS, TermSheet } from '@/types';
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

interface PipelineDealCardProps {
  deal: PipelineDeal;
  index: number;
  onDelete: (dealId: string) => void;
  onMoveToStage: (dealId: string, stage: PipelineStage) => void;
  onClick?: (deal: PipelineDeal) => void;
  termSheet?: TermSheet;
  onGenerateDD?: (dealId: string) => Promise<{ success: boolean; error?: string }>;
}

export function PipelineDealCard({
  deal,
  index,
  onDelete,
  onMoveToStage,
  onClick,
  termSheet,
  onGenerateDD,
}: PipelineDealCardProps) {
  const [showTermSheetModal, setShowTermSheetModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isGeneratingDD, setIsGeneratingDD] = useState(false);

  const handleGenerateDD = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGenerateDD || isGeneratingDD) return;
    setIsGeneratingDD(true);
    await onGenerateDD(deal.id);
    setIsGeneratingDD(false);
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
    </>
  );
}
