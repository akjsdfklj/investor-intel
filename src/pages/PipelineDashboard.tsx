import { useState } from 'react';
import { Header } from '@/components/Header';
import { PipelineKanban } from '@/components/pipeline/PipelineKanban';
import { AddPipelineDealForm } from '@/components/pipeline/AddPipelineDealForm';
import { PipelineFilters, PipelineFiltersState } from '@/components/pipeline/PipelineFilters';
import { usePipelineDeals } from '@/hooks/usePipelineDeals';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { STAGE_CONFIGS, PipelineStage } from '@/types';

export default function PipelineDashboard() {
  const { deals, isLoading, createDeal, updateDealStage, deleteDeal, generateDDForDeal, refetch } =
    usePipelineDeals();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<PipelineFiltersState>({
    sector: null,
    priority: null,
    sourceType: null,
  });

  // Calculate stage counts for stats bar
  const stageCounts = STAGE_CONFIGS.reduce((acc, stage) => {
    acc[stage.key] = deals.filter((d) => d.stage === stage.key).length;
    return acc;
  }, {} as Record<PipelineStage, number>);

  const handleStageChange = async (dealId: string, newStage: PipelineStage) => {
    await updateDealStage(dealId, newStage);
  };

  const handleDeleteDeal = async (dealId: string) => {
    await deleteDeal(dealId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Deal Pipeline</h1>
            <p className="text-muted-foreground text-sm">
              {deals.length} deals across {STAGE_CONFIGS.length} stages
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <PipelineFilters filters={filters} onFiltersChange={setFilters} />
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
          </div>
        </div>

        {/* Stage Stats Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STAGE_CONFIGS.filter((s) => s.key !== 'closed' && s.key !== 'passed').map(
            (stage) => (
              <div
                key={stage.key}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap"
                style={{ backgroundColor: stage.bgColor, color: stage.color }}
              >
                <span className="font-medium">{stage.label}</span>
                <span className="font-bold">{stageCounts[stage.key] || 0}</span>
              </div>
            )
          )}
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PipelineKanban
            deals={deals}
            filters={filters}
            onDealStageChange={handleStageChange}
            onDeleteDeal={handleDeleteDeal}
            onGenerateDD={generateDDForDeal}
          />
        )}
      </main>

      {/* Add Deal Modal */}
      <AddPipelineDealForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={createDeal}
      />
    </div>
  );
}
