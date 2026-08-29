import { Link } from 'expo-router';
import { SafeAreaView, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';

export default function FoundationScreen() {
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
      </View>
    </SafeAreaView>
  );
}
