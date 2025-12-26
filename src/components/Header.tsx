import { TrendingUp, Settings, Sparkles, FileStack } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">AI VC DD Copilot</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={location.pathname === '/bulk-dd' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/bulk-dd')}
            className="hidden sm:flex items-center gap-2"
          >
            <FileStack className="w-4 h-4" />
            Bulk DD
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Lovable AI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
