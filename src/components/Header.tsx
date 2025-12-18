import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, LogOut, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

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
          <span className="text-xl font-bold gradient-text">TechDD</span>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Badge 
                variant={user.plan === 'pro' ? 'default' : 'secondary'}
                className={user.plan === 'pro' ? 'gradient-primary text-primary-foreground border-0' : ''}
              >
                {user.plan === 'pro' ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </>
                ) : (
                  'Free'
                )}
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
