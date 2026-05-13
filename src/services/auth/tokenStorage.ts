import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'algohealth_refresh_token';
let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      // Intentionally not logging full error to avoid exposing secrets
      console.error('Failed to get refresh token');
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token');
    }
  },

  async clearTokens(): Promise<void> {
    inMemoryAccessToken = null;
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to delete refresh token');
    }
  },

  setAccessToken(token: string): void {
    inMemoryAccessToken = token;
  },

  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },
};
