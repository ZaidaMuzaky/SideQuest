import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { useSession } from '@/features/auth';
import { getQuestHistoryDetail, HistoryDetail, type QuestHistoryDetail } from '@/features/history';
import { getSupabaseClient } from '@/lib/supabase';

export default function HistoryDetailRoute(){const{id}=useLocalSearchParams<{id?:string}>();const{session}=useSession();const router=useRouter();const[detail,setDetail]=useState<QuestHistoryDetail|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState(false);const[retryKey,setRetryKey]=useState(0);useEffect(()=>{let mounted=true;queueMicrotask(()=>{if(mounted){setLoading(true);setError(false);}});if(!session||!id){queueMicrotask(()=>{if(mounted){setDetail(null);setLoading(false);}});return()=>{mounted=false;};}void getQuestHistoryDetail(getSupabaseClient(),session.user.id,id).then((value)=>{if(mounted)setDetail(value);}).catch(()=>{if(mounted)setError(true);}).finally(()=>{if(mounted)setLoading(false);});return()=>{mounted=false;};},[id,retryKey,session]);return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerStyle={{gap:20,padding:24}}><HistoryDetail detail={detail} loading={loading} error={error} onRetry={()=>setRetryKey((v)=>v+1)}/><Button variant="secondary" onPress={()=>router.back()}>{developmentCopy.back}</Button></ScrollView></SafeAreaView>}
