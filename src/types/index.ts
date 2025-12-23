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
