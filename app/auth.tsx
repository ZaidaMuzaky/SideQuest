import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { AppText, Button, Input } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { getSupabaseClient } from '@/lib/supabase';
import { signIn, safeAuthMessage, validateSignIn } from '@/features/auth/repository';
import { useRouter } from 'expo-router';

export default function AuthBoundary() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const validation = validateSignIn({ email, password });
    if (validation) { setError(validation); return; }
    setError(null); setLoading(true);
    try { await signIn(getSupabaseClient(), { email, password }); router.replace('/'); }
    catch (cause: unknown) { setError(safeAuthMessage(cause)); }
    finally { setLoading(false); }
  };
  return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 items-center justify-center gap-4 px-6"><AppText variant="title">{developmentCopy.authRequired}</AppText><Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><Input label="Password" secureTextEntry value={password} onChangeText={setPassword} {...(error ? { errorMessage: error } : {})} /><Button loading={loading} onPress={() => void submit()}>Sign in</Button></View></SafeAreaView>;
}
