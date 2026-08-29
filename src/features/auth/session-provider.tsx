import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSupabaseClient } from '@/lib/supabase';
import { usePathname, useRouter } from 'expo-router';
import { AppLoadingFallback } from '@/components/app/app-fallback';

import { restoreSession, routeDecision, subscribeToSession } from './session';

type SessionState = Readonly<{
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}>;

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true, error: null });

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();
    void restoreSession(client)
      .then((session) => {
        if (mounted) setState({ session, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (mounted) setState({ session: null, isLoading: false, error: error instanceof Error ? error : new Error('Session restore failed') });
      });
    const unsubscribe = subscribeToSession(client, (session) => {
      if (mounted) setState({ session, isLoading: false, error: null });
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={useMemo(() => state, [state])}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}

export function SessionGate({ children }: PropsWithChildren) {
  const state = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const decision = routeDecision(pathname, { session: state.session, isLoading: state.isLoading, error: state.error });
  useEffect(() => {
    if (decision === 'auth' && pathname.startsWith('/protected')) router.replace('/auth' as never);
  }, [decision, pathname, router]);
  if (decision === 'loading' || (decision === 'auth' && pathname.startsWith('/protected'))) return <AppLoadingFallback />;
  return <>{children}</>;
}
