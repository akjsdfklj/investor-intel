import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageSquare, TrendingUp, Users, Scale, Cpu, Sparkles } from 'lucide-react';
import type { Deal, MarketInsight } from '@/types';

interface MarketInsightsChatProps {
  deal: Deal;
  insights?: MarketInsight[];
  onUpdate: (insights: MarketInsight[]) => void;
}

const QUICK_QUESTIONS = [
  { label: 'Market Size', icon: TrendingUp, question: 'What is the current market size and expected growth rate for this sector?' },
  { label: 'Competitors', icon: Users, question: 'Who are the main competitors and what are their strengths/weaknesses?' },
  { label: 'Regulations', icon: Scale, question: 'What are the key regulatory risks and compliance requirements in this space?' },
  { label: 'Tech Trends', icon: Cpu, question: 'What technology trends could disrupt or benefit this business model?' },
];

export function MarketInsightsChat({ deal, insights = [], onUpdate }: MarketInsightsChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-insights-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          question,
          dealContext: {
            name: deal.name,
            sector: deal.sector,
            geography: deal.geography,
            description: deal.description,
            summary: deal.ddReport?.summary,
          },
          chatHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let fullResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                fullResponse += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Try to parse the response as JSON to extract structured data
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newInsight: MarketInsight = {
            id: crypto.randomUUID(),
            question,
            answer: parsed.answer || fullResponse,
            sources: parsed.sources || [],
            confidence: parsed.confidence || 'medium',
            category: parsed.category || 'market',
            timestamp: new Date().toISOString(),
          };
          onUpdate([...insights, newInsight]);
        }
      } catch {
        // If not JSON, save as plain text insight
        const newInsight: MarketInsight = {
          id: crypto.randomUUID(),
          question,
          answer: fullResponse,
          sources: [],
          confidence: 'medium',
          category: 'market',
          timestamp: new Date().toISOString(),
        };
        onUpdate([...insights, newInsight]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-border/50 h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-xl gradient-text flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Market Insights AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">Ask questions about the market, competitors, regulations, and trends</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_QUESTIONS.map((q) => (
            <Button
              key={q.label}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(q.question)}
              disabled={isLoading}
              className="text-xs"
            >
              <q.icon className="w-3 h-3 mr-1" />
              {q.label}
            </Button>
          ))}
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ask me anything about the market, competitors, or trends</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && insights.length > 0 && i === messages.length - 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={getConfidenceBadge(insights[insights.length - 1]?.confidence || 'medium')}>
                        {insights[insights.length - 1]?.confidence || 'medium'} confidence
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about market trends, competitors, regulations..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="gradient-primary text-primary-foreground">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
