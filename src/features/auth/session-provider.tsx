import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSupabaseClient } from '@/lib/supabase';
import { usePathname, useRouter } from 'expo-router';
import { AppErrorFallback, AppLoadingFallback } from '@/components/app/app-fallback';

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
    let client;
    try { client = getSupabaseClient(); } catch (error: unknown) {
      queueMicrotask(() => { if (mounted) setState({ session: null, isLoading: false, error: error instanceof Error ? error : new Error('Supabase configuration unavailable') }); });
      return () => { mounted = false; };
    }
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

  const value = useMemo(() => state, [state]);
  const configError = state.error?.message.startsWith('Missing required public environment variable') || state.error?.message.includes('EXPO_PUBLIC_SUPABASE_URL');
  return <SessionContext.Provider value={value}>{configError ? <AppErrorFallback onRetry={() => {}} description={`Development configuration error: ${state.error?.message}`} /> : children}</SessionContext.Provider>;
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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const onboardingRoute = pathname === '/auth' || pathname === '/signup' || pathname === '/onboarding';
  useEffect(() => {
    let active = true;
    if (!state.session || state.isLoading || state.error || onboardingRoute) {
      return () => { active = false; };
    }
    queueMicrotask(() => { if (active) setOnboardingChecked(false); });
    void getSupabaseClient().from('profiles').select('onboarding_completed_at').eq('user_id', state.session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setOnboardingChecked(true);
        if (!error && !data?.onboarding_completed_at && pathname !== '/onboarding') router.replace('/onboarding' as never);
      });
    return () => { active = false; };
  }, [onboardingRoute, pathname, router, state.error, state.isLoading, state.session]);
  useEffect(() => {
    if (decision === 'auth' && pathname.startsWith('/protected')) router.replace('/auth' as never);
  }, [decision, pathname, router]);
  const onboardingPending = Boolean(state.session && !state.isLoading && !state.error && !onboardingRoute && !onboardingChecked);
  if (decision === 'loading' || onboardingPending || (decision === 'auth' && pathname.startsWith('/protected'))) return <AppLoadingFallback />;
  return <>{children}</>;
}
