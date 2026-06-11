import { apiClient } from '@/src/services/api/apiClient';
import { 
  CreateFamilyRequest, 
  JoinFamilyRequest, 
  FamilyMemberCreate, 
  FamilyOut 
} from '@/src/features/family/familyTypes';

export const familyService = {
  async createFamily(data: CreateFamilyRequest): Promise<FamilyOut> {
    return apiClient.post<FamilyOut>('/families/', data);
  },

  async joinFamily(data: JoinFamilyRequest): Promise<void> {
    return apiClient.post<void>('/families/join', data);
  },

  async addFamilyMember(data: FamilyMemberCreate): Promise<void> {
    return apiClient.post<void>('/family-members/', data);
  },

  async getMyFamily(): Promise<FamilyOut> {
    return apiClient.get<FamilyOut>('/families/me');
  }
};
