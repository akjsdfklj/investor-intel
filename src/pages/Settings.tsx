import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Zap, Brain, Sparkles, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AISettings } from '@/types';

const AI_SETTINGS_KEY = 'techdd_ai_settings';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load settings from localStorage
  const loadSettings = (): AISettings => {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { provider: 'lovable' };
      }
    }
    return { provider: 'lovable' };
  };

  const [settings, setSettings] = useState<AISettings>(loadSettings);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
    
    // Simulate API key validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Settings saved',
      description: 'Your AI configuration has been updated',
    });
    setIsSaving(false);
  };

  const getProviderStatus = (provider: string): 'connected' | 'disconnected' => {
    if (provider === 'lovable') return 'connected';
    if (provider === 'openai' && settings.openaiKey) return 'connected';
    if (provider === 'gemini' && settings.geminiKey) return 'connected';
    return 'disconnected';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure your AI providers and API connections
            </p>
          </div>

          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Configuration
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI Provider</CardTitle>
                  <CardDescription>
                    Choose which AI service to use for due diligence analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={settings.provider}
                    onValueChange={(value: AISettings['provider']) =>
                      setSettings({ ...settings, provider: value })
                    }
                  >
                    {/* Lovable AI */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value="lovable" id="lovable" />
                      <div className="flex-1">
                        <Label htmlFor="lovable" className="flex items-center gap-2 cursor-pointer">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="font-medium">Lovable AI</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Recommended</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          No API key required. Uses Gemini 2.5 Flash for fast, accurate analysis.
                        </p>
                      </div>
                      <ConnectionStatus status="connected" label="Active" />
                    </div>

                    {/* OpenAI */}
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value="openai" id="openai" className="mt-1" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor="openai" className="flex items-center gap-2 cursor-pointer">
                            <span className="w-5 h-5 rounded bg-[#10a37f] text-white flex items-center justify-center text-xs font-bold">G</span>
                            <span className="font-medium">OpenAI GPT-5</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Use your own OpenAI API key for advanced reasoning.
                          </p>
                        </div>
                        {settings.provider === 'openai' && (
                          <div className="space-y-2">
                            <Label htmlFor="openai-key">API Key</Label>
                            <div className="relative">
                              <Input
                                id="openai-key"
                                type={showOpenAIKey ? 'text' : 'password'}
                                placeholder="sk-..."
                                value={settings.openaiKey || ''}
                                onChange={(e) =>
                                  setSettings({ ...settings, openaiKey: e.target.value })
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                              >
                                {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <ConnectionStatus
                        status={getProviderStatus('openai')}
                        label={settings.openaiKey ? 'Connected' : 'Not configured'}
                      />
                    </div>

                    {/* Google Gemini */}
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value="gemini" id="gemini" className="mt-1" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor="gemini" className="flex items-center gap-2 cursor-pointer">
                            <span className="w-5 h-5 rounded bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center text-xs font-bold">G</span>
                            <span className="font-medium">Google Gemini Pro</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Use your own Google AI API key for multimodal analysis.
                          </p>
                        </div>
                        {settings.provider === 'gemini' && (
                          <div className="space-y-2">
                            <Label htmlFor="gemini-key">API Key</Label>
                            <div className="relative">
                              <Input
                                id="gemini-key"
                                type={showGeminiKey ? 'text' : 'password'}
                                placeholder="AIza..."
                                value={settings.geminiKey || ''}
                                onChange={(e) =>
                                  setSettings({ ...settings, geminiKey: e.target.value })
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                              >
                                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <ConnectionStatus
                        status={getProviderStatus('gemini')}
                        label={settings.geminiKey ? 'Connected' : 'Not configured'}
                      />
                    </div>
                  </RadioGroup>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSave} disabled={isSaving} className="gradient-primary text-primary-foreground">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections">
              <Card>
                <CardHeader>
                  <CardTitle>API Connections</CardTitle>
                  <CardDescription>
                    View the status of all connected services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Lovable AI</p>
                        <p className="text-sm text-muted-foreground">Default AI provider</p>
                      </div>
                    </div>
                    <ConnectionStatus status="connected" label="Always available" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#10a37f] flex items-center justify-center">
                        <span className="text-white font-bold">G</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">OpenAI</p>
                        <p className="text-sm text-muted-foreground">GPT-5 for advanced analysis</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status={settings.openaiKey ? 'connected' : 'disconnected'}
                      label={settings.openaiKey ? 'API key configured' : 'Not configured'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-bold">G</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Google Gemini</p>
                        <p className="text-sm text-muted-foreground">Multimodal analysis</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status={settings.geminiKey ? 'connected' : 'disconnected'}
                      label={settings.geminiKey ? 'API key configured' : 'Not configured'}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
