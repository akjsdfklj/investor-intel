import { useState } from 'react';
import { Header } from '@/components/Header';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { PortfolioCompanyCard } from '@/components/portfolio/PortfolioCompanyCard';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Search, RefreshCw } from 'lucide-react';
import { PortfolioStatus } from '@/types';

export default function Portfolio() {
  const { companies, isLoading, metrics, refetch } = usePortfolio();
  const [statusFilter, setStatusFilter] = useState<PortfolioStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = companies.filter(company => {
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.sector?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    exited: companies.filter(c => c.status === 'exited').length,
    written_off: companies.filter(c => c.status === 'written_off').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-muted-foreground text-sm">
              Track and manage your investments
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
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="mb-8">
          <PortfolioSummary metrics={metrics} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as PortfolioStatus | 'all')}>
            <TabsList>
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
              <TabsTrigger value="exited">Exited ({statusCounts.exited})</TabsTrigger>
              <TabsTrigger value="written_off">Written Off ({statusCounts.written_off})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Company List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {companies.length === 0
                ? 'No portfolio companies yet. Finalize a deal from the Pipeline to add your first investment.'
                : 'No companies match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <PortfolioCompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
