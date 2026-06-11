import { apiClient } from '@/src/services/api/apiClient';
import { 
  MedicalRecordResponse, 
  MedicalRecordUpdate 
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
  }
};
