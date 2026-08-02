import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/integrations/supabase/supabaseClient';

// Resolves the RLS identity chain documented in reca-app's migrations:
// auth.uid() -> users.id -> employees.user_id -> employees.id (this is the
// `operator_id` missions are assigned to). Fetched once per session, not
// re-derived on every write (see supabaseSyncTransport.ts).
export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session; employeeId: string | null };

export type AuthContextValue = AuthState & {
  login(email: string, password: string): Promise<{ error: string | null }>;
  logout(): Promise<void>;
};

const AuthReactContext = createContext<AuthContextValue | null>(null);

async function resolveEmployeeId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data.id as string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function hydrate(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ status: 'signedOut' });
        return;
      }
      const employeeId = await resolveEmployeeId(session.user.id);
      if (!cancelled) setState({ status: 'signedIn', session, employeeId });
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  const value: AuthContextValue = { ...state, login, logout };

  return <AuthReactContext.Provider value={value}>{children}</AuthReactContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthReactContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
