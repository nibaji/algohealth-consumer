export const pushNotificationService = {
  async syncLinkedDevice(_userId: string): Promise<void> {
    return;
  },

  async unlinkCurrentDevice(_userId: string): Promise<void> {
    return;
  },

  subscribeToReceived(_listener: () => void): () => void {
    return (): void => undefined;
  },

  subscribeToResponses(_listener: () => void): () => void {
    return (): void => undefined;
  },

  consumeInitialResponse(): boolean {
    return false;
  },
};
