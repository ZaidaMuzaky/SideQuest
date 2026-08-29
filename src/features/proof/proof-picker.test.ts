import { PROOF_MAX_BYTES, validateRawProofAsset } from './proof-picker';

const valid = { uri: 'file:///proof.jpg', mimeType: 'image/jpeg', fileSize: 1024, width: 1200, height: 800 };

test('SQ-0501 validates supported local image assets and bounds', () => {
  expect(validateRawProofAsset(valid)).toBeNull();
  expect(validateRawProofAsset({ ...valid, mimeType: 'video/mp4' })).toBe('format');
  expect(validateRawProofAsset({ ...valid, fileSize: PROOF_MAX_BYTES + 1 })).toBe('size');
  expect(validateRawProofAsset({ ...valid, uri: 'https://example.test/proof.jpg' })).toBe('uri');
  expect(validateRawProofAsset({ ...valid, width: 0 })).toBe('dimensions');
});
