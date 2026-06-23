/* eslint-disable react-refresh/only-export-components */
// WARNING: HIPAA/security review required before production use.
// This auth implementation is for prototype/demo purposes only.
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface SignUpMetadata {
  full_name: string;
  role: string;
  organization_name: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error || fallback;
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message && e.message !== '{}')
      return e.message;
    if (typeof e.msg === 'string' && e.msg) return e.msg;
    if (typeof e.error_description === 'string') return e.error_description;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    if (!supabase)
      return { error: { message: 'Authentication is not configured. Please try the demo instead.' } };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: { message: extractErrorMessage(error, 'Sign in failed. Please check your credentials.') } };
      return { error: null };
    } catch (err) {
      return { error: { message: extractErrorMessage(err, 'Sign in failed. Please try again.') } };
    }
  }

  async function signUp(email: string, password: string, metadata: SignUpMetadata) {
    if (!supabase)
      return { error: { message: 'Authentication is not configured. Please try the demo instead.' } };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) return { error: { message: extractErrorMessage(error, 'Sign up failed. Please try again.') } };
      // Supabase returns a user with no identities if email already exists (to prevent enumeration)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: { message: 'An account with this email may already exist. Try signing in instead.' } };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: extractErrorMessage(err, 'Sign up failed. Please try again.') } };
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function resetPassword(email: string) {
    if (!supabase) return { error: { message: 'Authentication is not configured.' } };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) return { error: { message: extractErrorMessage(error, 'Password reset failed. Please try again.') } };
      return { error: null };
    } catch (err) {
      return { error: { message: extractErrorMessage(err, 'Password reset failed. Please try again.') } };
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
