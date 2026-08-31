import { useState } from 'react';
import { AppText,Button,Card } from '@/components/ui';
import { developmentCopy } from '@/constants/development-copy';
import type { ProofUploadPhase,UploadProofResult } from './upload-service';

type Props={upload:(onProgress:(phase:ProofUploadPhase)=>void)=>Promise<UploadProofResult>;onUploaded:(result:UploadProofResult)=>void};
export function ProofUploadUi({upload,onUploaded}:Props){const [phase,setPhase]=useState<ProofUploadPhase>();const [failed,setFailed]=useState(false);
 const run=()=>{if(phase)return;setFailed(false);void upload(setPhase).then(onUploaded).catch(()=>setFailed(true)).finally(()=>setPhase(undefined));};
 return <Card accessibilityLabel={developmentCopy.proof.uploadTitle}>
  <AppText variant="title">{developmentCopy.proof.uploadTitle}</AppText>
  {phase?<AppText accessibilityLiveRegion="polite">{developmentCopy.proof.uploading}</AppText>:null}
  {failed?<AppText accessibilityLiveRegion="polite" tone="danger">{developmentCopy.proof.uploadFailed}</AppText>:null}
  <Button loading={Boolean(phase)} onPress={run}>{failed?developmentCopy.proof.retryUpload:developmentCopy.proof.upload}</Button>
 </Card>;
}
