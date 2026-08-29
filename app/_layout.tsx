import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from '@/theme';
import { AppErrorFallback } from '@/components/app/app-fallback';
import { observability } from '@/lib/observability/logger';
import { SessionGate, SessionProvider } from '@/features/auth';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  observability.captureError(error, { operation: 'router' });
  return <AppErrorFallback onRetry={retry} />;
}

function AppStack() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider><SessionGate><AppStack /></SessionGate></SessionProvider>
    </ThemeProvider>
  );
}
