import { SafeAreaView, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';

export function AppLoadingFallback() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <LoadingState message={developmentCopy.loading} />
      </View>
    </SafeAreaView>
  );
}

export function AppErrorFallback({ onRetry, description = developmentCopy.errorDescription }: { onRetry: () => void; description?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <ErrorState title={developmentCopy.errorTitle} description={description} retryLabel={developmentCopy.retry} onRetry={onRetry} />
      </View>
    </SafeAreaView>
  );
}
