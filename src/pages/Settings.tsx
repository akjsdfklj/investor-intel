import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { IntegrationCard, ConnectionStatus as IntegrationStatus } from '@/components/IntegrationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Zap, Brain, Sparkles, Save, Eye, EyeOff, Database, FileText, Mail, Flame, Plug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AISettings } from '@/types';

const AI_SETTINGS_KEY = 'techdd_ai_settings';
const INTEGRATION_SETTINGS_KEY = 'techdd_integration_settings';

interface IntegrationState {
  status: IntegrationStatus;
  message?: string;
  values: Record<string, string>;
}

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

  // Integration states
  const [integrations, setIntegrations] = useState<Record<string, IntegrationState>>({
    airtable: { status: 'not_configured', message: 'Missing API Key and Base ID', values: {} },
    google: { status: 'not_configured', message: 'Missing Service Account credentials', values: {} },
    resend: { status: 'not_configured', message: 'Missing API Key', values: {} },
    firecrawl: { status: 'connected', message: 'API Key configured (managed via Lovable connector)', values: {} },
  });

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = () => {
    const savedIntegrations = localStorage.getItem(INTEGRATION_SETTINGS_KEY);
    if (savedIntegrations) {
      try {
        const parsed = JSON.parse(savedIntegrations);
        setIntegrations(prev => ({
          ...prev,
          airtable: {
            status: parsed.airtable?.apiKey && parsed.airtable?.baseId ? 'connected' : 'not_configured',
            message: parsed.airtable?.apiKey && parsed.airtable?.baseId ? 'Connected' : 'Missing API Key and Base ID',
            values: parsed.airtable || {},
          },
          google: {
            status: parsed.google?.serviceAccountJson ? 'connected' : 'not_configured',
            message: parsed.google?.serviceAccountJson ? 'Connected' : 'Missing Service Account credentials',
            values: parsed.google || {},
          },
          resend: {
            status: parsed.resend?.apiKey ? 'connected' : 'not_configured',
            message: parsed.resend?.apiKey ? 'Connected' : 'Missing API Key',
            values: parsed.resend || {},
          },
        }));
      } catch {
        console.error('Failed to parse integration settings');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Settings saved',
      description: 'Your AI configuration has been updated',
    });
    setIsSaving(false);
  };

  const handleIntegrationValuesChange = (key: string, values: Record<string, string>) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: { ...prev[key], values },
    }));
  };

  const handleIntegrationSave = (key: string) => {
    const savedIntegrations = localStorage.getItem(INTEGRATION_SETTINGS_KEY);
    const parsed = savedIntegrations ? JSON.parse(savedIntegrations) : {};
    parsed[key] = integrations[key].values;
    localStorage.setItem(INTEGRATION_SETTINGS_KEY, JSON.stringify(parsed));

    // Update status based on whether required fields are filled
    let isConfigured = false;
    let missingMessage = '';
    
    if (key === 'airtable') {
      isConfigured = !!integrations[key].values.apiKey && !!integrations[key].values.baseId;
      missingMessage = 'Missing API Key and Base ID';
    } else if (key === 'google') {
      isConfigured = !!integrations[key].values.serviceAccountJson;
      missingMessage = 'Missing Service Account credentials';
    } else if (key === 'resend') {
      isConfigured = !!integrations[key].values.apiKey;
      missingMessage = 'Missing API Key';
    }

    setIntegrations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: isConfigured ? 'connected' : 'not_configured',
        message: isConfigured ? 'Saved successfully' : missingMessage,
      },
    }));

    toast({
      title: 'Integration saved',
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} settings have been saved.`,
    });
  };

  const handleTestConnection = async (key: string) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: { ...prev[key], status: 'testing', message: 'Testing connection...' },
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const values = integrations[key].values;
    let isValid = false;
    let errorMessage = 'Missing required fields';

    if (key === 'airtable') {
      isValid = !!values.apiKey && !!values.baseId;
      if (!values.apiKey) errorMessage = 'API Key is required';
      else if (!values.baseId) errorMessage = 'Base ID is required';
    } else if (key === 'google') {
      isValid = !!values.serviceAccountJson;
      if (values.serviceAccountJson) {
        try {
          JSON.parse(values.serviceAccountJson);
        } catch {
          setIntegrations(prev => ({
            ...prev,
            [key]: { ...prev[key], status: 'error', message: 'Invalid JSON format' },
          }));
          return;
        }
      } else {
        errorMessage = 'Service Account JSON is required';
      }
    } else if (key === 'resend') {
      isValid = !!values.apiKey;
      if (!values.apiKey) errorMessage = 'API Key is required';
    }

    setIntegrations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: isValid ? 'connected' : 'error',
        message: isValid ? 'Connection successful' : errorMessage,
      },
    }));
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
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Config
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Plug className="w-4 h-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Status
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

            <TabsContent value="integrations" className="space-y-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground">Pipeline Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  Configure external services for deal sourcing and management
                </p>
              </div>

              <IntegrationCard
                name="Airtable"
                description="Sync deals from your Airtable base"
                icon={<Database className="w-5 h-5" />}
                status={integrations.airtable.status}
                statusMessage={integrations.airtable.message}
                fields={[
                  { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'pat...' },
                  { key: 'baseId', label: 'Base ID', type: 'text', placeholder: 'app...' },
                ]}
                values={integrations.airtable.values}
                onValuesChange={(values) => handleIntegrationValuesChange('airtable', values)}
                onTest={() => handleTestConnection('airtable')}
                onSave={() => handleIntegrationSave('airtable')}
              />

              <IntegrationCard
                name="Google Services"
                description="Google Forms for deal intake, Google Docs for term sheets"
                icon={<FileText className="w-5 h-5" />}
                status={integrations.google.status}
                statusMessage={integrations.google.message}
                fields={[
                  { 
                    key: 'serviceAccountJson', 
                    label: 'Service Account JSON', 
                    type: 'textarea', 
                    placeholder: '{"type": "service_account", ...}' 
                  },
                ]}
                values={integrations.google.values}
                onValuesChange={(values) => handleIntegrationValuesChange('google', values)}
                onTest={() => handleTestConnection('google')}
                onSave={() => handleIntegrationSave('google')}
              />

              <IntegrationCard
                name="Resend"
                description="Send term sheets and track email opens"
                icon={<Mail className="w-5 h-5" />}
                status={integrations.resend.status}
                statusMessage={integrations.resend.message}
                fields={[
                  { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 're_...' },
                  { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'deals@yourfund.com' },
                ]}
                values={integrations.resend.values}
                onValuesChange={(values) => handleIntegrationValuesChange('resend', values)}
                onTest={() => handleTestConnection('resend')}
                onSave={() => handleIntegrationSave('resend')}
              />

              <IntegrationCard
                name="Firecrawl"
                description="AI-powered website scraping for deal analysis"
                icon={<Flame className="w-5 h-5" />}
                status={integrations.firecrawl.status}
                statusMessage={integrations.firecrawl.message}
                fields={[]}
                values={{}}
                onValuesChange={() => {}}
                isManaged
                managedMessage="This integration is managed via Lovable connector. The API key is already configured and ready to use."
              />
            </TabsContent>

            <TabsContent value="connections">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>
                    View the status of all connected services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Providers */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">AI Providers</p>
                  </div>
                  
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

                  {/* Pipeline Integrations */}
                  <div className="mt-6 mb-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Pipeline Integrations</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Airtable</p>
                        <p className="text-sm text-muted-foreground">Deal sync from Airtable</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status={integrations.airtable.status === 'connected' ? 'connected' : 'disconnected'}
                      label={integrations.airtable.status === 'connected' ? 'Connected' : 'Not configured'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Google Services</p>
                        <p className="text-sm text-muted-foreground">Forms & Docs integration</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status={integrations.google.status === 'connected' ? 'connected' : 'disconnected'}
                      label={integrations.google.status === 'connected' ? 'Connected' : 'Not configured'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Resend</p>
                        <p className="text-sm text-muted-foreground">Email sending</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status={integrations.resend.status === 'connected' ? 'connected' : 'disconnected'}
                      label={integrations.resend.status === 'connected' ? 'Connected' : 'Not configured'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Firecrawl</p>
                        <p className="text-sm text-muted-foreground">Website scraping</p>
                      </div>
                    </div>
                    <ConnectionStatus
                      status="connected"
                      label="Managed by Lovable"
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
