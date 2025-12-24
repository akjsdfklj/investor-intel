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
