import { AskBenishResponse } from '@/src/features/consults/consultTypes';
import { apiClient } from '@/src/services/api/apiClient';

export const askBenishService = {
  ask(formData: FormData): Promise<AskBenishResponse> {
    return apiClient.post<AskBenishResponse>('/medical-records/ask-benish', formData);
  },
};
