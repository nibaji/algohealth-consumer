import { apiClient } from '@/src/services/api/apiClient';
import { 
  CreateFamilyRequest, 
  JoinFamilyRequest, 
  FamilyMemberCreate, 
  FamilyMemberUpdate,
  FamilyMemberResponse,
  FamilyOut 
} from '@/src/features/family/familyTypes';

export const familyService = {
  async createFamily(data: CreateFamilyRequest): Promise<FamilyOut> {
    return apiClient.post<FamilyOut>('/families/', data);
  },

  async joinFamily(data: JoinFamilyRequest): Promise<void> {
    return apiClient.post<void>('/families/join', data);
  },

  async rejectFamily(data: JoinFamilyRequest): Promise<void> {
    return apiClient.post<void>('/families/reject', data);
  },

  async addFamilyMember(data: FamilyMemberCreate): Promise<void> {
    return apiClient.post<void>('/family-members/', data);
  },

  async getMyFamily(): Promise<FamilyOut> {
    return apiClient.get<FamilyOut>('/families/me');
  },

  async getFamilyMembers(): Promise<FamilyMemberResponse[]> {
    return apiClient.get<FamilyMemberResponse[]>('/family-members/');
  },

  async getFamilyMember(memberId: string): Promise<FamilyMemberResponse> {
    return apiClient.get<FamilyMemberResponse>(`/family-members/${memberId}`);
  },

  async updateFamilyMember(memberId: string, data: FamilyMemberUpdate): Promise<void> {
    return apiClient.patch<void>(`/family-members/${memberId}`, data);
  },

  async deleteFamilyMember(memberId: string): Promise<void> {
    return apiClient.delete<void>(`/family-members/${memberId}`);
  }
};
