import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  FileSpreadsheet, 
  Table2, 
  BookOpen, 
  Search, 
  Zap,
  User,
  Globe,
  DollarSign,
  Building2,
  Mail,
  FileText,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PipelineDeal } from '@/types';

interface DealSourceDDSelectorProps {
  onSelectDeal: (deal: PipelineDeal) => void;
  isAnalyzing: boolean;
}

export function DealSourceDDSelector({ onSelectDeal, isAnalyzing }: DealSourceDDSelectorProps) {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);

  useEffect(() => {
    fetchDealsFromSources();
  }, []);

  const fetchDealsFromSources = async () => {
    setIsLoading(true);
    try {
      // Fetch deals that came from external sources (not manual)
      const { data, error } = await supabase
        .from('pipeline_deals')
        .select('*')
        .in('source_type', ['gsheets', 'airtable', 'notion'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: PipelineDeal[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        websiteUrl: row.website_url,
        description: row.description,
        stage: row.stage,
        stageEnteredAt: row.stage_entered_at,
        priority: row.priority || 2,
        sector: row.sector,
        sourceType: row.source_type || 'manual',
        sourceId: row.source_id,
        founderName: row.founder_name,
        founderEmail: row.founder_email,
        pitchDeckUrl: row.pitch_deck_url,
        pitchDeckContent: row.pitch_deck_content,
        askAmount: row.ask_amount,
        valuation: row.valuation,
        assignedTo: row.assigned_to,
        ddReportId: row.dd_report_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setDeals(mapped);
    } catch (error) {
      console.error('Error fetching deals from sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'gsheets':
        return FileSpreadsheet;
      case 'airtable':
        return Table2;
      case 'notion':
        return BookOpen;
      default:
        return Database;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'gsheets':
        return 'Google Sheets';
      case 'airtable':
        return 'Airtable';
      case 'notion':
        return 'Notion';
      default:
        return 'External';
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return null;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.founderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAndAnalyze = () => {
    if (selectedDeal) {
      onSelectDeal(selectedDeal);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Deals from External Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (deals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Deals from External Sources
          </CardTitle>
          <CardDescription>
            No deals synced from external sources yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Connect Google Sheets, Airtable, or Notion in{' '}
              <a href="/deal-sources" className="text-primary hover:underline">Deal Sources</a>{' '}
              to import deals for analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Analyze from Deal Sources
        </CardTitle>
        <CardDescription>
          Select a deal imported from Google Sheets, Airtable, or Notion to run comprehensive DD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, sector, or founder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Deal List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredDeals.map((deal) => {
              const SourceIcon = getSourceIcon(deal.sourceType || 'gsheets');
              const isSelected = selectedDeal?.id === deal.id;
              const hasDDReport = !!deal.ddReportId;

              return (
                <div
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{deal.name}</h4>
                        {hasDDReport && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            DD Complete
                          </Badge>
                        )}
                      </div>
                      
                      {/* Source and Sector */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <SourceIcon className="w-3 h-3" />
                          {getSourceLabel(deal.sourceType || 'gsheets')}
                        </span>
                        {deal.sector && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {deal.sector}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Deal Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {deal.founderName && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{deal.founderName}</span>
                          </div>
                        )}
                        {deal.websiteUrl && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            <span className="truncate">{new URL(deal.websiteUrl).hostname}</span>
                          </div>
                        )}
                        {deal.askAmount && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span>Ask: {formatCurrency(deal.askAmount)}</span>
                          </div>
                        )}
                        {deal.valuation && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span>Val: {formatCurrency(deal.valuation)}</span>
                          </div>
                        )}
                        {deal.founderEmail && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{deal.founderEmail}</span>
                          </div>
                        )}
                        {deal.pitchDeckUrl && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>Pitch Deck</span>
                          </div>
                        )}
                      </div>

                      {/* Description preview */}
                      {deal.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {deal.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-primary rotate-90' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              );
            })}

            {filteredDeals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No deals match your search</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Deal Summary & Action */}
        {selectedDeal && (
          <div className="pt-4 border-t space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Selected: {selectedDeal.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                The DD analysis will use all available data including:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedDeal.websiteUrl && (
                  <Badge variant="secondary">Website Content</Badge>
                )}
                {selectedDeal.description && (
                  <Badge variant="secondary">Description</Badge>
                )}
                {selectedDeal.founderName && (
                  <Badge variant="secondary">Founder Info</Badge>
                )}
                {selectedDeal.sector && (
                  <Badge variant="secondary">Sector: {selectedDeal.sector}</Badge>
                )}
                {selectedDeal.askAmount && (
                  <Badge variant="secondary">Raise: {formatCurrency(selectedDeal.askAmount)}</Badge>
                )}
                {selectedDeal.valuation && (
                  <Badge variant="secondary">Valuation: {formatCurrency(selectedDeal.valuation)}</Badge>
                )}
                {selectedDeal.pitchDeckUrl && (
                  <Badge variant="secondary">Pitch Deck</Badge>
                )}
              </div>
            </div>

            <Button
              onClick={handleSelectAndAnalyze}
              disabled={isAnalyzing}
              className="w-full gradient-primary text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              {selectedDeal.ddReportId ? 'Regenerate Deep DD' : 'Run Deep Due Diligence'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
