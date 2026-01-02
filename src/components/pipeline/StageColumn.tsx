import { Droppable } from '@hello-pangea/dnd';
import { PipelineDeal, PipelineStage, StageConfig } from '@/types';
import { PipelineDealCard } from './PipelineDealCard';
import { cn } from '@/lib/utils';
import { Inbox, Filter, Search, Users, FileText, CheckCircle, XCircle } from 'lucide-react';

interface StageColumnProps {
  config: StageConfig;
  deals: PipelineDeal[];
  onDeleteDeal: (dealId: string) => void;
  onMoveToStage: (dealId: string, stage: PipelineStage) => void;
  onDealClick?: (deal: PipelineDeal) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox className="w-4 h-4" />,
  filter: <Filter className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  'file-text': <FileText className="w-4 h-4" />,
  'check-circle': <CheckCircle className="w-4 h-4" />,
  'x-circle': <XCircle className="w-4 h-4" />,
};

export function StageColumn({
  config,
  deals,
  onDeleteDeal,
  onMoveToStage,
  onDealClick,
}: StageColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg">
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-lg border-b border-border"
        style={{ backgroundColor: config.bgColor }}
      >
        <span style={{ color: config.color }}>{iconMap[config.icon]}</span>
        <h3 className="font-medium text-sm" style={{ color: config.color }}>
          {config.label}
        </h3>
        <span
          className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: config.color, color: 'white' }}
        >
          {deals.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={config.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto',
              snapshot.isDraggingOver && 'bg-primary/5 rounded-b-lg'
            )}
          >
            {deals.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No deals
              </div>
            ) : (
              deals.map((deal, index) => (
                <PipelineDealCard
                  key={deal.id}
                  deal={deal}
                  index={index}
                  onDelete={onDeleteDeal}
                  onMoveToStage={onMoveToStage}
                  onClick={onDealClick}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
