import { apiClient } from '@/src/services/api/apiClient';
import {
  ConsultationChatResponse,
  ConsultationSession,
  ConsultationSessionDetail,
} from '@/src/features/consults/consultTypes';

interface ListSessionsOptions {
  skip?: number;
  limit?: number;
  familyMemberId?: string;
}

const DEFAULT_SESSION_LIMIT = 20;

export const consultService = {
  listSessions({
    skip = 0,
    limit = DEFAULT_SESSION_LIMIT,
    familyMemberId,
  }: ListSessionsOptions = {}): Promise<ConsultationSession[]> {
    const familyMemberQuery = familyMemberId
      ? `&family_member_id=${encodeURIComponent(familyMemberId)}`
      : '';
    return apiClient.get<ConsultationSession[]>(
      `/consultation-chats/sessions?skip=${skip}&limit=${limit}${familyMemberQuery}`
    );
  },

  getSession(sessionId: string): Promise<ConsultationSessionDetail> {
    return apiClient.get<ConsultationSessionDetail>(
      `/consultation-chats/sessions/${encodeURIComponent(sessionId)}`
    );
  },

  sendMessage(formData: FormData): Promise<ConsultationChatResponse> {
    return apiClient.post<ConsultationChatResponse>('/consultation-chats/chat', formData);
  },
};
