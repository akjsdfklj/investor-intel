import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'techdd_auth';

// Mock user data for demo purposes
const mockUsers: { email: string; password: string; user: User }[] = [];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored auth on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          user: parsed.user,
          token: parsed.token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check mock users first
    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      const token = `jwt_${Date.now()}_${Math.random().toString(36).substr(2)}`;
      const authData = { user: mockUser.user, token };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      setState({
        user: mockUser.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    }

    // For demo: accept any email/password and create user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
      plan: 'free',
      createdAt: new Date().toISOString(),
    };

    const token = `jwt_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    const authData = { user: newUser, token };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setState({
      user: newUser,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };

    // Store in mock users
    mockUsers.push({ email, password, user: newUser });

    const token = `jwt_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    const authData = { user: newUser, token };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setState({
      user: newUser,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('techdd_deals');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
