import * as DocumentPicker from 'expo-document-picker';

import { uriToBlob } from '@/src/utils/file';

interface CreateChatFormDataParams {
  question: string;
  familyMemberId: string | null;
  audioFile: DocumentPicker.DocumentPickerAsset | null;
  documents: DocumentPicker.DocumentPickerAsset[];
  sessionId?: string | null;
}

const appendAsset = async (
  formData: FormData,
  field: 'files' | 'audio_files',
  asset: DocumentPicker.DocumentPickerAsset
): Promise<void> => {
  if (process.env.EXPO_OS === 'web') {
    const blob = await uriToBlob(asset.uri);
    formData.append(field, blob, asset.name);
    return;
  }

  formData.append(field, {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || 'application/octet-stream',
  } as unknown as Blob);
};

export const createChatFormData = async ({
  question,
  familyMemberId,
  audioFile,
  documents,
  sessionId,
}: CreateChatFormDataParams): Promise<FormData> => {
  const formData = new FormData();
  formData.append('question', question);
  if (familyMemberId) formData.append('family_member_id', familyMemberId);
  if (sessionId) formData.append('session_id', sessionId);

  for (const document of documents) {
    await appendAsset(formData, 'files', document);
  }
  if (audioFile) await appendAsset(formData, 'audio_files', audioFile);

  return formData;
};
