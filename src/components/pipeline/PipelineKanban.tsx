import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { PipelineDeal, PipelineStage, STAGE_CONFIGS } from '@/types';
import { StageColumn } from './StageColumn';
import { PipelineFiltersState } from './PipelineFilters';

interface PipelineKanbanProps {
  deals: PipelineDeal[];
  filters: PipelineFiltersState;
  onDealStageChange: (dealId: string, newStage: PipelineStage) => Promise<void>;
  onDeleteDeal: (dealId: string) => void;
  onDealClick?: (deal: PipelineDeal) => void;
  onGenerateDD?: (dealId: string) => Promise<{ success: boolean; error?: string }>;
}

export function PipelineKanban({
  deals,
  filters,
  onDealStageChange,
  onDeleteDeal,
  onDealClick,
  onGenerateDD,
}: PipelineKanbanProps) {
  // Filter deals based on active filters
  const filteredDeals = deals.filter((deal) => {
    if (filters.sector && deal.sector !== filters.sector) return false;
    if (filters.priority && deal.priority !== filters.priority) return false;
    if (filters.sourceType && deal.sourceType !== filters.sourceType) return false;
    return true;
  });

  // Group deals by stage
  const dealsByStage = STAGE_CONFIGS.reduce((acc, stage) => {
    acc[stage.key] = filteredDeals.filter((d) => d.stage === stage.key);
    return acc;
  }, {} as Record<PipelineStage, PipelineDeal[]>);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside or same position, do nothing
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const newStage = destination.droppableId as PipelineStage;
    await onDealStageChange(draggableId, newStage);
  };

  const handleMoveToStage = async (dealId: string, stage: PipelineStage) => {
    await onDealStageChange(dealId, stage);
  };

  // Active stages (not closed/passed)
  const activeStages = STAGE_CONFIGS.filter(
    (s) => s.key !== 'closed' && s.key !== 'passed'
  );

  // Closed/Passed stages
  const endStages = STAGE_CONFIGS.filter(
    (s) => s.key === 'closed' || s.key === 'passed'
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        {/* Active Pipeline Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {activeStages.map((stage) => (
            <StageColumn
              key={stage.key}
              config={stage}
              deals={dealsByStage[stage.key] || []}
              onDeleteDeal={onDeleteDeal}
              onMoveToStage={handleMoveToStage}
              onDealClick={onDealClick}
              onGenerateDD={onGenerateDD}
            />
          ))}
        </div>

        {/* Closed/Passed Section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Completed Deals
          </h3>
          <div className="flex gap-4">
            {endStages.map((stage) => (
              <StageColumn
                key={stage.key}
                config={stage}
                deals={dealsByStage[stage.key] || []}
                onDeleteDeal={onDeleteDeal}
                onMoveToStage={handleMoveToStage}
                onDealClick={onDealClick}
                onGenerateDD={onGenerateDD}
              />
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
