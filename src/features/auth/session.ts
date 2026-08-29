import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

export function sessionRoute(state: { session: Session | null; isLoading: boolean; error: Error | null }): 'loading' | 'auth' | 'protected' {
  if (state.isLoading) return 'loading';
  if (state.error || !state.session) return 'auth';
  return 'protected';
}

export function routeDecision(route: string, state: { session: Session | null; isLoading: boolean; error: Error | null }): 'loading' | 'auth' | 'allow' {
  if (!route.startsWith('/protected')) return 'allow';
  const decision = sessionRoute(state);
  return decision === 'protected' ? 'allow' : decision;
}

export async function restoreSession(client: SupabaseClient<Database>): Promise<Session | null> {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeToSession(client: SupabaseClient<Database>, onChange: (session: Session | null) => void): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) => onChange(session));
  return () => data.subscription.unsubscribe();
}
