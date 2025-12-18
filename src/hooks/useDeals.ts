import { useState, useEffect, useCallback } from 'react';
import { Deal, DDReport } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const DEALS_STORAGE_KEY = 'techdd_deals';

// Mock DD report generator
const generateMockDDReport = (deal: Deal): DDReport => {
  const scores = [
    { score: Math.floor(Math.random() * 3) + 3, reason: "Strong founding team with relevant industry experience and proven track record in building successful products." },
    { score: Math.floor(Math.random() * 3) + 2, reason: "Large addressable market with strong growth potential. Competition exists but differentiation is clear." },
    { score: Math.floor(Math.random() * 3) + 3, reason: "Product shows strong product-market fit signals with growing user engagement and retention metrics." },
    { score: Math.floor(Math.random() * 3) + 2, reason: "Network effects and proprietary technology create moderate barriers to entry." },
  ];

  return {
    id: `dd_${Date.now()}`,
    dealId: deal.id,
    summary: `${deal.name} presents an interesting investment opportunity in the technology sector. The company demonstrates strong fundamentals with a capable team and clear product vision. Market conditions appear favorable, though competitive dynamics should be monitored closely. Key strengths include technical innovation and early customer traction. Areas requiring further diligence include go-to-market strategy scaling and unit economics optimization. Overall, this opportunity warrants further discussion and deeper analysis of financial projections.`,
    scores: {
      team: { score: scores[0].score, reason: scores[0].reason },
      market: { score: scores[1].score, reason: scores[1].reason },
      product: { score: scores[2].score, reason: scores[2].reason },
      moat: { score: scores[3].score, reason: scores[3].reason },
    },
    followUpQuestions: [
      "What is the current monthly burn rate and runway?",
      "Can you share cohort analysis data for user retention?",
      "What are the key metrics you're tracking for product-market fit?",
      "How does your technology stack compare to competitors?",
      "What is your customer acquisition cost (CAC) and lifetime value (LTV)?",
      "What are the main risks you see in executing your roadmap?",
    ],
    generatedAt: new Date().toISOString(),
  };
};

export function useDeals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load deals from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(DEALS_STORAGE_KEY);
      if (stored) {
        try {
          const allDeals = JSON.parse(stored) as Deal[];
          const userDeals = allDeals.filter(d => d.userId === user.id);
          setDeals(userDeals);
        } catch {
          setDeals([]);
        }
      }
    } else {
      setDeals([]);
    }
    setIsLoading(false);
  }, [user]);

  // Save deals to localStorage
  const saveDeals = useCallback((newDeals: Deal[]) => {
    const stored = localStorage.getItem(DEALS_STORAGE_KEY);
    let allDeals: Deal[] = [];
    
    if (stored) {
      try {
        allDeals = JSON.parse(stored);
        // Remove current user's deals
        allDeals = allDeals.filter(d => d.userId !== user?.id);
      } catch {
        allDeals = [];
      }
    }
    
    // Add updated user deals
    allDeals = [...allDeals, ...newDeals];
    localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(allDeals));
  }, [user]);

  const createDeal = useCallback(async (data: { name: string; url?: string; description?: string }): Promise<{ success: boolean; error?: string; deal?: Deal }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check deal limit for free users
    if (user.plan === 'free' && deals.length >= 3) {
      return { success: false, error: 'Free tier limit reached (3 deals). Upgrade to Pro for unlimited deals.' };
    }

    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      userId: user.id,
      name: data.name,
      url: data.url || undefined,
      description: data.description || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedDeals = [...deals, newDeal];
    setDeals(updatedDeals);
    saveDeals(updatedDeals);

    return { success: true, deal: newDeal };
  }, [user, deals, saveDeals]);

  const generateDD = useCallback(async (dealId: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const dealIndex = deals.findIndex(d => d.id === dealId);
    if (dealIndex === -1) {
      return { success: false, error: 'Deal not found' };
    }

    const deal = deals[dealIndex];
    const ddReport = generateMockDDReport(deal);

    const updatedDeal = { ...deal, ddReport };
    const updatedDeals = [...deals];
    updatedDeals[dealIndex] = updatedDeal;

    setDeals(updatedDeals);
    saveDeals(updatedDeals);

    return { success: true };
  }, [deals, saveDeals]);

  const deleteDeal = useCallback(async (dealId: string): Promise<{ success: boolean }> => {
    const updatedDeals = deals.filter(d => d.id !== dealId);
    setDeals(updatedDeals);
    saveDeals(updatedDeals);
    return { success: true };
  }, [deals, saveDeals]);

  const getDeal = useCallback((dealId: string): Deal | undefined => {
    return deals.find(d => d.id === dealId);
  }, [deals]);

  const canCreateDeal = user?.plan === 'pro' || deals.length < 3;
  const dealsRemaining = user?.plan === 'pro' ? Infinity : Math.max(0, 3 - deals.length);

  return {
    deals,
    isLoading,
    createDeal,
    generateDD,
    deleteDeal,
    getDeal,
    canCreateDeal,
    dealsRemaining,
  };
}
