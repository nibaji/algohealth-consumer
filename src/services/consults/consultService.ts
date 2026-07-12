import { apiClient } from '@/src/services/api/apiClient';
import {
  ConsultationChatResponse,
  ConsultationSession,
  ConsultationSessionDetail,
} from '@/src/features/consults/consultTypes';

export const consultService = {
  listSessions(skip = 0, limit = 20): Promise<ConsultationSession[]> {
    return apiClient.get<ConsultationSession[]>(
      `/consultation-chats/sessions?skip=${skip}&limit=${limit}`
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
