export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  audio_uri?: string | null;
  audio_duration?: number;
  documents?: { name: string; size?: number }[];
}

const chatHistoryCache: Record<string, ChatMessage[]> = {};

export const consultCache = {
  get(memberId: string): ChatMessage[] | undefined {
    return chatHistoryCache[memberId];
  },
  set(memberId: string, messages: ChatMessage[]): void {
    chatHistoryCache[memberId] = messages;
  },
  clear(): void {
    Object.keys(chatHistoryCache).forEach((key) => {
      delete chatHistoryCache[key];
    });
  },
};
