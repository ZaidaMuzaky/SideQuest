import { Link, useRouter } from 'expo-router';
import { SafeAreaView, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getSupabaseClient } from '@/lib/supabase';
import { signOut, safeAuthMessage, useSession } from '@/features/auth';
import { useState } from 'react';

export default function FoundationScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const handleSignOut = async () => {
    setError(null);
    try { await signOut(getSupabaseClient()); router.replace('/auth' as never); }
    catch (cause: unknown) { setError(safeAuthMessage(cause)); }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <AppText style={{ textAlign: 'center' }} variant="display">
          {developmentCopy.productName}
        </AppText>
        <AppText style={{ textAlign: 'center' }} tone="secondary">
          {developmentCopy.foundationReady}
        </AppText>
        <Link asChild href="/foundation-details">
          <Button>{developmentCopy.openRoutingCheck}</Button>
        </Link>
        {session ? <Button onPress={() => void handleSignOut()}>{developmentCopy.signOut}</Button> : null}
        {error ? <AppText tone="secondary">{error}</AppText> : null}
      </View>
    </SafeAreaView>
  );
}
