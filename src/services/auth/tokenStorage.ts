import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'algohealth_refresh_token';
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

const isWeb = process.env.EXPO_OS === 'web';

const getWebStorage = (): Storage | null => {
  if (!isWeb || typeof window === 'undefined') {
    return null;
  }
  return window.sessionStorage;
};

const getWebStoredValue = (key: string): string | null => {
  try {
    const storage = getWebStorage();
    return storage ? storage.getItem(key) : null;
  } catch (error) {
    console.error(`Error reading web storage key "${key}":`, error);
    return null;
  }
};

const setWebStoredValue = (key: string, value: string): void => {
  try {
    const storage = getWebStorage();
    storage?.setItem(key, value);
  } catch (error) {
    console.error(`Error writing web storage key "${key}":`, error);
  }
};

const removeWebStoredValue = (key: string): void => {
  try {
    const storage = getWebStorage();
    storage?.removeItem(key);
  } catch (error) {
    console.error(`Error removing web storage key "${key}":`, error);
  }
};

export const tokenStorage = {
  async getRefreshToken(): Promise<string | null> {
    if (inMemoryRefreshToken) {
      return inMemoryRefreshToken;
    }
    if (isWeb) {
      inMemoryRefreshToken = getWebStoredValue(REFRESH_TOKEN_KEY);
      return inMemoryRefreshToken;
    }
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      inMemoryRefreshToken = token;
      return inMemoryRefreshToken;
    } catch {
      // Intentionally not logging full error to avoid exposing secrets
      console.error('Failed to get refresh token');
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    inMemoryRefreshToken = token;
    if (isWeb) {
      setWebStoredValue(REFRESH_TOKEN_KEY, token);
      return;
    }
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      console.error('Failed to save refresh token');
    }
  },

  async clearTokens(): Promise<void> {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    if (isWeb) {
      removeWebStoredValue(REFRESH_TOKEN_KEY);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
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
