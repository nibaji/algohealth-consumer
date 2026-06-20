import * as SecureStore from 'expo-secure-store';

const MUTE_BOT_SPEECH_KEY = 'algohealth_mute_bot_speech';
const isWeb = process.env.EXPO_OS === 'web';

export const settingsStorage = {
  async getMuteBotSpeech(): Promise<boolean> {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(MUTE_BOT_SPEECH_KEY) === 'true';
      }
      return false;
    }
    try {
      const val = await SecureStore.getItemAsync(MUTE_BOT_SPEECH_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setMuteBotSpeech(value: boolean): Promise<void> {
    const strVal = value ? 'true' : 'false';
    if (isWeb) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MUTE_BOT_SPEECH_KEY, strVal);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(MUTE_BOT_SPEECH_KEY, strVal);
    } catch (err) {
      console.error('Failed to save mute bot speech setting', err);
    }
  },

  async clear(): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(MUTE_BOT_SPEECH_KEY);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(MUTE_BOT_SPEECH_KEY);
    } catch (err) {
      console.error('Failed to clear settings', err);
    }
  }
};
