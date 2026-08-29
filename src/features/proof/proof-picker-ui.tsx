import { useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { AppText,Button,Card } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import { captureProofWithCamera,pickProofFromLibrary,type ProofAsset,type ProofPickResult } from './proof-picker';

type Props={onSelected:(asset:ProofAsset)=>void;camera?:()=>Promise<ProofPickResult>;library?:()=>Promise<ProofPickResult>};
export function ProofPickerUi({onSelected,camera=captureProofWithCamera,library=pickProofFromLibrary}:Props){
 const [asset,setAsset]=useState<ProofAsset>(); const [busy,setBusy]=useState(false); const [issue,setIssue]=useState<string>(); const [denied,setDenied]=useState(false);
 const run=(source:()=>Promise<ProofPickResult>)=>{if(busy)return;setBusy(true);setIssue(undefined);void source().then((result)=>{
  if(result.kind==='selected'){setAsset(result.asset);setDenied(false);onSelected(result.asset);}else if(result.kind==='permission-denied'){setDenied(true);setIssue(developmentCopy.proof.permissionDenied);}else if(result.kind==='invalid')setIssue(developmentCopy.proof.invalid);
 }).catch(()=>setIssue(developmentCopy.proof.unavailable)).finally(()=>setBusy(false));};
 return <Card accessibilityLabel={developmentCopy.proof.title} variant="elevated"><View style={{gap:12}}>
  <AppText accessibilityRole="header" variant="title">{developmentCopy.proof.title}</AppText>
  {asset?<Image accessibilityLabel={developmentCopy.proof.preview} source={{uri:asset.uri}} style={{height:180,width:'100%'}} resizeMode="contain"/>:null}
  {issue?<AppText accessibilityLiveRegion="polite" tone="danger">{issue}</AppText>:null}
  <Button loading={busy} onPress={()=>run(camera)}>{developmentCopy.proof.camera}</Button>
  <Button disabled={busy} onPress={()=>run(library)} variant="secondary">{asset?developmentCopy.proof.replace:developmentCopy.proof.choose}</Button>
  {asset?<Button disabled={busy} onPress={()=>{setAsset(undefined);setIssue(undefined);}} variant="ghost">{developmentCopy.proof.remove}</Button>:null}
  {denied?<Button onPress={()=>{void Linking.openSettings();}} variant="ghost">{developmentCopy.proof.settings}</Button>:null}
 </View></Card>;
}
