export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface Deal {
  id: string;
  userId: string;
  name: string;
  url?: string;
  description?: string;
  sector?: string;
  geography?: string;
  fundingStage?: string;
  pitchDeckUrl?: string;
  pitchDeckContent?: string;
  createdAt: string;
  ddReport?: DDReport;
}

export interface DDReport {
  id: string;
  dealId: string;
  summary: string;
  scores: {
    team: ScoreItem;
    market: ScoreItem;
    product: ScoreItem;
    moat: ScoreItem;
  };
  followUpQuestions: string[];
  generatedAt: string;
  scrapedContent?: string;
  
  // Enhanced analysis
  pitchSanityCheck?: PitchSanityCheck;
  swotAnalysis?: SWOTAnalysis;
  moatAssessment?: MoatAssessment;
  competitorMapping?: Competitor[];
  investmentSuccessRate?: InvestmentSuccessRate;
  financialAnalysis?: FinancialAnalysis;
  
  // Advanced DD Features
  tamAnalysis?: TAMAnalysis;
  scenarioModel?: ScenarioModel;
  marketInsights?: MarketInsight[];
  detailedCompetitors?: DetailedCompetitor[];
  keywordIntelligence?: KeywordIntelligence;
  regulatoryAnalysis?: RegulatoryAnalysis;
  teamAnalysis?: TeamAnalysis;
  techStackAnalysis?: TechStackAnalysis;
}

export interface ScoreItem {
  score: number; // 1-5
  reason: string;
}

export interface PitchSanityCheck {
  status: 'green' | 'amber' | 'red';
  problem: string;
  solution: string;
  targetCustomer: string;
  pricingModel: string;
  keyMetrics: string[];
  claimedTAM: string;
  missingInfo: string[];
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MoatAssessment {
  score: number; // 0-10
  type: 'none' | 'tech_ip' | 'data_advantage' | 'network_effects' | 'brand' | 'switching_costs' | 'distribution' | 'regulation';
  reasoning: string;
}

export interface Competitor {
  name: string;
  description: string;
  country: string;
  fundingStage: string;
  websiteUrl?: string;
  comparison: string;
}

export interface InvestmentSuccessRate {
  probability: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  keyRisks: string[];
  keyStrengths: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FounderInquiry {
  id: string;
  dealId: string;
  founderName: string;
  founderEmail: string;
  founderBio: string;
  linkedinUrl?: string;
  additionalInfo?: string;
  submittedAt: string;
}

export interface AISettings {
  provider: 'lovable' | 'openai' | 'gemini';
  openaiKey?: string;
  geminiKey?: string;
}

export interface FinancialKPIs {
  // Revenue Metrics
  arpu: number | null;
  arr: number | null;
  mrr: number | null;
  revenue: number | null;
  revenueGrowthRate: number | null;
  
  // Profitability
  grossMargin: number | null;
  profit: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  
  // Customer Metrics
  totalCustomers: number | null;
  cac: number | null;
  ltv: number | null;
  ltvCacRatio: number | null;
  churnRate: number | null;
  customerLifeCycle: number | null;
  paybackPeriod: number | null;
  
  // Unit Economics
  avgOrderValue: number | null;
  purchaseFrequency: number | null;
  
  // Sales
  sales: number | null;
  salesGrowthRate: number | null;
  
  // Product
  productLifeCycleStage: 'introduction' | 'growth' | 'maturity' | 'decline' | null;
}

export interface IndustryBenchmark {
  metric: string;
  metricKey: string;
  startupValue: number | null;
  industryAvg: number | null;
  topPerformers: number | null;
  rating: 'below' | 'average' | 'above' | 'excellent';
}

export interface KPIForecast {
  year: number;
  revenue: number;
  profit: number;
  ebitda: number;
  customers: number;
  arpu: number;
  ltv: number;
  cac: number;
}

export interface FinancialAnalysis {
  kpis: FinancialKPIs;
  peerBenchmarks: IndustryBenchmark[];
  forecasts: KPIForecast[];
  assumptions: string[];
  aiInsights: string;
  lastUpdated: string;
}

// TAM Analysis
export interface TAMAnalysis {
  topDown: {
    globalMarket: number;
    cagr: number;
    tam: number;
    sam: number;
    som: number;
    methodology: string;
    sources: string[];
  };
  bottomUp: {
    targetCustomers: number;
    avgRevenuePerCustomer: number;
    calculatedTAM: number;
    penetrationRate: number;
    methodology: string;
  };
  validation: {
    status: 'validated' | 'questionable' | 'inflated';
    claimedVsCalculated: string;
    reasoning: string;
    redFlags: string[];
  };
}

// Scenario Modeling
export interface ScenarioModel {
  baseCase: ScenarioProjection;
  bullCase: ScenarioProjection;
  bearCase: ScenarioProjection;
  assumptions: ScenarioAssumptions;
  probabilityWeighted: {
    expectedRevenue: number;
    expectedValuation: number;
    irr: number;
  };
}

export interface ScenarioProjection {
  year1: YearMetrics;
  year3: YearMetrics;
  year5: YearMetrics;
  exitValuation: number;
  multipleUsed: string;
  irr: number;
}

export interface YearMetrics {
  revenue: number;
  customers: number;
  arpu: number;
  growthRate: number;
  burnRate: number;
  runway: number;
}

export interface ScenarioAssumptions {
  marketGrowth: { base: number; bull: number; bear: number };
  customerGrowth: { base: number; bull: number; bear: number };
  churnRate: { base: number; bull: number; bear: number };
  pricingPower: { base: number; bull: number; bear: number };
  fundingEnvironment: string;
}

// Enhanced Competitor with Full Details
export interface DetailedCompetitor {
  name: string;
  description: string;
  country: string;
  headquarters: string;
  founded: number;
  employeeCount: number;
  websiteUrl: string;
  
  // Funding Details
  funding: {
    totalRaised: number;
    lastRound: string;
    lastRoundAmount: number;
    lastRoundDate: string;
    valuation: number | null;
  };
  
  // Investors
  investors: {
    name: string;
    type: 'VC' | 'Angel' | 'PE' | 'Corporate' | 'Accelerator';
    leadInvestor: boolean;
  }[];
  
  // KPIs (estimated)
  kpis: {
    estimatedRevenue: number | null;
    estimatedCustomers: number | null;
    estimatedArpu: number | null;
    growthRate: number | null;
  };
  
  // Comparison
  comparison: {
    strengthsVsStartup: string[];
    weaknessesVsStartup: string[];
    marketPosition: 'leader' | 'challenger' | 'niche' | 'emerging';
    threatLevel: 'high' | 'medium' | 'low';
  };
}

// Market Insights Chat
export interface MarketInsight {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  category: 'market' | 'competitor' | 'trend' | 'regulation' | 'technology';
}

// Keyword Intelligence
export interface KeywordIntelligence {
  primaryKeywords: {
    keyword: string;
    searchVolume: number;
    difficulty: number;
    trend: 'rising' | 'stable' | 'declining';
    cpc: number;
  }[];
  competitorKeywords: {
    keyword: string;
    competitors: string[];
    overlap: number;
  }[];
  opportunityGaps: {
    keyword: string;
    potential: 'high' | 'medium' | 'low';
    reasoning: string;
  }[];
  seoScore: number;
  recommendations: string[];
}

// Regulatory Analysis
export interface RegulatoryAnalysis {
  overallRisk: 'high' | 'medium' | 'low';
  jurisdictions: {
    region: string;
    risks: string[];
    compliance: string[];
  }[];
  upcomingRegulations: string[];
  recommendations: string[];
}

// Team Analysis
export interface TeamAnalysis {
  overallScore: number;
  founders: {
    name: string;
    role: string;
    background: string;
    previousExits: number;
    domainExpertise: 'high' | 'medium' | 'low';
    linkedinUrl?: string;
  }[];
  teamStrengths: string[];
  gaps: string[];
  advisors: string[];
  keyHires: string[];
}

// Tech Stack Analysis
export interface TechStackAnalysis {
  stack: string[];
  scalability: 'high' | 'medium' | 'low';
  technicalDebt: 'high' | 'medium' | 'low';
  ipStrength: number;
  patents: number;
  openSourceUsage: string[];
  securityScore: number;
}

// Enhanced Competitor Comparison Types
export interface CompetitorProductFeature {
  feature: string;
  hasFeature: boolean;
  notes: string;
}

export interface CompetitorPricingTier {
  tier: string;
  price: string;
  features: string[];
}

export interface CompetitorExecutive {
  name: string;
  role: string;
  background: string;
}

export interface CompetitorWinLoss {
  winsAgainst: string[];
  lossesAgainst: string[];
  overlapScore: number;
}

export interface EnhancedCompetitor extends DetailedCompetitor {
  marketShare: number | null;
  burnRate: number | null;
  recentNews: string[];
  keyDifferentiators: string[];
  productFeatures: CompetitorProductFeature[];
  pricing: CompetitorPricingTier[];
  techStack: string[];
  executives: CompetitorExecutive[];
  winLossAnalysis: CompetitorWinLoss;
}

export interface CompetitorComparison {
  startupScore: number;
  competitorScores: {
    name: string;
    score: number;
  }[];
  featureMatrix: {
    feature: string;
    startup: boolean;
    competitors: { name: string; has: boolean }[];
  }[];
  pricingPosition: 'cheapest' | 'mid-range' | 'premium' | 'enterprise';
  overallRanking: string[];
}

// Bulk Due Diligence Types
export interface BulkDDSession {
  id: string;
  createdAt: string;
  status: 'uploading' | 'processing' | 'ranking' | 'complete' | 'error';
  startups: BulkStartupEntry[];
  ranking?: BulkRanking;
}

export interface BulkStartupEntry {
  id: string;
  name: string;
  sourceType: 'file' | 'url';
  sourceUrl?: string;
  fileName?: string;
  status: 'pending' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  pitchDeckContent?: string;
  ddReport?: DDReport;
  error?: string;
}

export interface BulkRankingEntry {
  rank: 1 | 2 | 3;
  startupId: string;
  name: string;
  overallScore: number;
  reasoning: string;
  keyStrengths: string[];
  keyRisks: string[];
}

export interface BulkRankingItem {
  rank: number;
  startupId: string;
  name: string;
  score: number;
  breakdown: {
    team: number;
    market: number;
    product: number;
    moat: number;
    financials: number;
  };
}

export interface BulkRanking {
  top3: BulkRankingEntry[];
  allRankings: BulkRankingItem[];
  comparisonInsights: string;
  investmentThesis: string;
}
