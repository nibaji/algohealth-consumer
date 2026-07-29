import * as SecureStore from 'expo-secure-store';

const LINKED_DEVICE_KEY = 'algohealth_linked_push_device';
const isWeb = process.env.EXPO_OS === 'web';

export interface StoredLinkedDevice {
  userId: string;
  deviceId: string;
  pushToken: string;
}

const isStoredLinkedDevice = (value: unknown): value is StoredLinkedDevice => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === 'string'
    && typeof record.deviceId === 'string'
    && typeof record.pushToken === 'string'
  );
};

export const linkedDeviceStorage = {
  async get(): Promise<StoredLinkedDevice | null> {
    if (isWeb) {
      return null;
    }

    try {
      const value = await SecureStore.getItemAsync(LINKED_DEVICE_KEY);
      if (!value) {
        return null;
      }
      const parsed: unknown = JSON.parse(value);
      return isStoredLinkedDevice(parsed) ? parsed : null;
    } catch {
      console.error('Failed to read the linked notification device');
      return null;
    }
  },

  async set(device: StoredLinkedDevice): Promise<void> {
    if (isWeb) {
      return;
    }

    try {
      await SecureStore.setItemAsync(LINKED_DEVICE_KEY, JSON.stringify(device));
    } catch {
      console.error('Failed to save the linked notification device');
      throw new Error('Failed to save the linked notification device');
    }
  },

  async clear(): Promise<void> {
    if (isWeb) {
      return;
    }

    try {
      await SecureStore.deleteItemAsync(LINKED_DEVICE_KEY);
    } catch {
      console.error('Failed to clear the linked notification device');
      throw new Error('Failed to clear the linked notification device');
    }
  },
};
