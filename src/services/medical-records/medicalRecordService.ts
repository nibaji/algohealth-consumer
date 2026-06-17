import { apiClient } from '@/src/services/api/apiClient';
import { 
  MedicalRecordResponse, 
  MedicalRecordUpdate,
  ConsultResponse
} from '@/src/features/medical-records/medicalRecordTypes';

export const medicalRecordService = {
  async listMedicalRecords(familyMemberId?: string): Promise<MedicalRecordResponse[]> {
    const query = familyMemberId ? `?family_member_id=${familyMemberId}` : '';
    return apiClient.get<MedicalRecordResponse[]>(`/medical-records/${query}`);
  },

  async createMedicalRecord(formData: FormData): Promise<MedicalRecordResponse> {
    return apiClient.post<MedicalRecordResponse>('/medical-records/', formData);
  },

  async getMedicalRecord(id: string): Promise<MedicalRecordResponse> {
    return apiClient.get<MedicalRecordResponse>(`/medical-records/${id}`);
  },

  async updateMedicalRecord(id: string, data: MedicalRecordUpdate): Promise<MedicalRecordResponse> {
    return apiClient.patch<MedicalRecordResponse>(`/medical-records/${id}`, data);
  },

  async deleteMedicalRecord(id: string): Promise<void> {
    return apiClient.delete<void>(`/medical-records/${id}`);
  },

  async consult(formData: FormData): Promise<ConsultResponse> {
    return apiClient.post<ConsultResponse>('/medical-records/ask-benish', formData);
  },

  /**
   * Uploads new document and/or audio files and links them to an existing medical record.
   *
   * Flow:
   * 1. POST /utils/store-files   — upload binary to cloud storage, get back blob metadata.
   * 2. POST /documents/upload    — register each file's metadata with medical_record_id.
   *
   * This two-step approach is necessary because PATCH /medical-records/{id} only accepts JSON.
   */
  async addAttachmentsToRecord(
    recordId: string,
    familyMemberId: string | null,
    documentAssets: { uri: string; name: string; mimeType?: string | null; size?: number | null }[],
    audioAssets: { uri: string; name: string; mimeType?: string | null; size?: number | null }[]
  ): Promise<void> {
    interface StoredFile {
      filename: string;
      stored_name: string | null;
      blob_name: string | null;
      bucket: string | null;
      url: string | null;
      size: number | null;
    }

    const processAssets = async (
      assets: { uri: string; name: string; mimeType?: string | null; size?: number | null }[],
      contentType: string
    ): Promise<void> => {
      for (const asset of assets) {
        // Step 1: Upload the file binary
        const storeFormData = new FormData();
        storeFormData.append('files', {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        } as unknown as Blob);
        storeFormData.append('folder', `medical-records/${recordId}`);

        const storeResult = await apiClient.post<StoredFile[] | StoredFile>(
          '/utils/store-files',
          storeFormData
        );

        const stored: StoredFile | null = Array.isArray(storeResult)
          ? (storeResult[0] ?? null)
          : storeResult ?? null;

        if (!stored) {
          throw new Error(`Failed to upload file: ${asset.name}`);
        }

        // Step 2: Register the file metadata linked to the medical record
        await apiClient.post('/documents/upload', {
          filename: stored.filename ?? asset.name,
          stored_name: stored.stored_name ?? null,
          blob_name: stored.blob_name ?? null,
          bucket: stored.bucket ?? null,
          url: stored.url ?? null,
          mime_type: asset.mimeType ?? null,
          content_type: contentType,
          size: stored.size ?? asset.size ?? null,
          family_member_id: familyMemberId ?? null,
          medical_record_id: recordId,
        });
      }
    };

    await processAssets(documentAssets, 'document');
    await processAssets(audioAssets, 'audio');
  },
};
