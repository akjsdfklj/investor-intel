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
}

export interface ScoreItem {
  score: number; // 1-5
  reason: string;
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
