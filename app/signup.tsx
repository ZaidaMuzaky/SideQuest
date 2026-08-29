import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { AppText, Button, Input } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase';
import { signUp, safeAuthMessage, validateSignUp } from '@/features/auth/repository';

export default function SignupScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [complete, setComplete] = useState(false);
  async function submit() { const input = { email, password, displayName }; const invalid = validateSignUp(input); if (invalid) { setError(invalid); return; } setLoading(true); setError(null); try { await signUp(getSupabaseClient(), input); setComplete(true); } catch (cause) { setError(safeAuthMessage(cause)); } finally { setLoading(false); } }
  return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 justify-center gap-4 px-6"><AppText variant="title">Create your SideQuest account</AppText>{complete ? <AppText>Check your email to continue.</AppText> : <><Input label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words"/><Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/><Input label="Password" value={password} onChangeText={setPassword} secureTextEntry/><Button onPress={() => void submit()} loading={loading}>Sign up</Button>{error ? <AppText tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}</>}</View></SafeAreaView>;
}
