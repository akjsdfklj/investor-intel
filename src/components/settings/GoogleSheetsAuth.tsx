import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { FileSpreadsheet, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleOAuthToken {
  id: string;
  user_email: string;
  expires_at: string;
  created_at: string;
}

export function GoogleSheetsAuth() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<GoogleOAuthToken | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('id, user_email, expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConnectedAccount(data as GoogleOAuthToken | null);
    } catch (error) {
      console.error('Failed to check Google connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsConnecting(true);
    try {
      // Get OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'Google Sign In',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'google-oauth-success') {
            window.removeEventListener('message', handleMessage);
            popup?.close();
            
            toast({
              title: 'Google Account Connected',
              description: `Signed in as ${event.data.email}`,
            });
            
            await checkConnection();
          } else if (event.data?.type === 'google-oauth-error') {
            window.removeEventListener('message', handleMessage);
            popup?.close();
            
            toast({
              title: 'Connection Failed',
              description: event.data.error || 'Failed to connect Google account',
              variant: 'destructive',
            });
          }
        };

        window.addEventListener('message', handleMessage);

        // Poll for popup close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            checkConnection();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to start Google sign-in. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      if (connectedAccount) {
        const { error } = await supabase
          .from('google_oauth_tokens')
          .delete()
          .eq('id', connectedAccount.id);

        if (error) throw error;

        setConnectedAccount(null);
        toast({
          title: 'Account Disconnected',
          description: 'Google account has been disconnected',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect Google account',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Sheets</CardTitle>
              <CardDescription>
                Access private Google Sheets for deal import
              </CardDescription>
            </div>
          </div>
          <ConnectionStatus 
            status={connectedAccount ? 'connected' : 'disconnected'} 
            label={connectedAccount ? 'Connected' : 'Not connected'} 
          />
        </div>
      </CardHeader>
      <CardContent>
        {connectedAccount ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{connectedAccount.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(connectedAccount.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Disconnect Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with your Google account to import deals from private Google Sheets. 
              You'll only need to share sheets with your connected account.
            </p>
            <Button 
              onClick={handleSignIn}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Sign in with Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
