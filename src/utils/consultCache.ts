export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
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
