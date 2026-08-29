import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const PROOF_MAX_BYTES = 10 * 1024 * 1024;
const acceptedMimeTypes = new Set(['image/jpeg','image/png','image/heic','image/heif']);

export type ProofAsset = { uri:string; mimeType:string; byteSize:number; width:number; height:number };
type RawAsset = { uri:string; mimeType?:string|null; fileSize?:number|null; width:number; height:number };
export type ProofPickResult = {kind:'selected';asset:ProofAsset}|{kind:'cancelled'}|{kind:'permission-denied';source:'camera'|'library'}|{kind:'invalid';reason:'format'|'size'|'dimensions'|'uri'};

export function validateRawProofAsset(asset:RawAsset):'format'|'size'|'dimensions'|'uri'|null {
  if (!/^file:|^content:/i.test(asset.uri)) return 'uri';
  if (!asset.mimeType || !acceptedMimeTypes.has(asset.mimeType.toLowerCase())) return 'format';
  if (!Number.isInteger(asset.fileSize) || (asset.fileSize ?? 0)<=0 || (asset.fileSize ?? 0)>PROOF_MAX_BYTES) return 'size';
  if (!Number.isInteger(asset.width)||!Number.isInteger(asset.height)||asset.width<=0||asset.height<=0) return 'dimensions';
  return null;
}

async function normalize(asset:RawAsset):Promise<ProofAsset> {
  // Re-encoding omits source EXIF (including geolocation) and gives uploads one safe MIME.
  const normalized=await ImageManipulator.manipulateAsync(asset.uri,[],{compress:.85,format:ImageManipulator.SaveFormat.JPEG});
  const byteSize=(await (await fetch(normalized.uri)).blob()).size;
  if (byteSize<=0||byteSize>PROOF_MAX_BYTES) throw new Error('normalized_size');
  return {uri:normalized.uri,mimeType:'image/jpeg',byteSize,width:normalized.width,height:normalized.height};
}

async function convert(result:ImagePicker.ImagePickerResult):Promise<ProofPickResult>{
  if(result.canceled)return {kind:'cancelled'};
  const asset=result.assets[0]; if(!asset)return {kind:'invalid',reason:'uri'};
  const reason=validateRawProofAsset(asset); if(reason)return {kind:'invalid',reason};
  try{return {kind:'selected',asset:await normalize(asset)};}catch{return {kind:'invalid',reason:'size'};}
}

const options:ImagePicker.ImagePickerOptions={mediaTypes:['images'],allowsMultipleSelection:false,allowsEditing:false,quality:1,exif:false,base64:false};

export async function pickProofFromLibrary():Promise<ProofPickResult>{
  const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permission.granted)return {kind:'permission-denied',source:'library'};
  return convert(await ImagePicker.launchImageLibraryAsync(options));
}
export async function captureProofWithCamera():Promise<ProofPickResult>{
  const permission=await ImagePicker.requestCameraPermissionsAsync();
  if(!permission.granted)return {kind:'permission-denied',source:'camera'};
  return convert(await ImagePicker.launchCameraAsync(options));
}
