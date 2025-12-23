import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '@/hooks/useDeals';
import { Header } from '@/components/Header';
import { DealCard } from '@/components/DealCard';
import { CreateDealForm } from '@/components/CreateDealForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Briefcase, Loader2, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { deals, isLoading, createDeal, generateDD } = useDeals();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatingDealId, setGeneratingDealId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateDeal = async (data: { name: string; url?: string; description?: string }) => {
    setIsCreating(true);
    const result = await createDeal(data);
    setIsCreating(false);

    if (result.success) {
      toast({
        title: "Deal created",
        description: `${data.name} has been added to your pipeline`,
      });
      setIsCreateOpen(false);
    } else {
      toast({
        title: "Cannot create deal",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleGenerateDD = async (dealId: string) => {
    setGeneratingDealId(dealId);
    const result = await generateDD(dealId);
    setGeneratingDealId(null);

    if (result.success) {
      toast({
        title: "DD Report generated",
        description: "Your due diligence analysis is ready",
      });
    } else {
      toast({
        title: "Generation failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (dealId: string) => {
    navigate(`/deal/${dealId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Deal Pipeline</h1>
              <p className="text-muted-foreground mt-1">
                {deals.length === 0 
                  ? "Start by adding your first deal" 
                  : `${deals.length} deal${deals.length === 1 ? '' : 's'} in your pipeline`}
              </p>
            </div>
            
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Deal
            </Button>
          </div>
        </div>

        {/* Deals Grid or Empty State */}
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Briefcase className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No deals yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add your first startup to begin generating AI-powered due diligence reports
            </p>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add Your First Deal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal, index) => (
              <div key={deal.id} style={{ animationDelay: `${index * 100}ms` }}>
                <DealCard
                  deal={deal}
                  onGenerateDD={handleGenerateDD}
                  onViewDetails={handleViewDetails}
                  isGenerating={generatingDealId === deal.id}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateDealForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateDeal}
        isSubmitting={isCreating}
      />
    </div>
  );
}
