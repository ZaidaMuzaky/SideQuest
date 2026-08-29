import { SafeAreaView, View } from 'react-native';
import { AppText } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';

export default function AuthBoundary() {
  return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 items-center justify-center px-6"><AppText variant="title">{developmentCopy.authRequired}</AppText></View></SafeAreaView>;
}
