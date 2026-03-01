import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Set to true to bypass Supabase auth with a fake user
export const DEV_MODE = true;

const DEV_USER = {
  id: 'dev-user-0000-0000-000000000001',
  email: 'dev@localhost',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? DEV_USER : null);
  const [loading, setLoading] = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) return;

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (DEV_MODE) {
      setUser(DEV_USER);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signup = async (email: string, password: string) => {
    if (DEV_MODE) {
      setUser(DEV_USER);
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    if (DEV_MODE) {
      setUser(DEV_USER); // In dev mode, just stay logged in
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, signup, logout }}>
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
