import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  getSpeakingMessageId,
  isTtsPaused,
  stopSpeaking,
  subscribeTtsState,
  toggleMessageSpeech,
} from '@/src/utils/ttsManager';

interface ChatPlaybackReturn {
  playingMessageId: string | null;
  ttsState: { speakingMessageId: string | null; isPaused: boolean };
  activePlayerStatus: ReturnType<typeof useAudioPlayerStatus>;
  handlePlayPauseMessage: (messageId: string, uri: string) => void;
  handleSeekMessage: (messageId: string, percentage: number) => void;
  handleToggleSpeech: (messageId: string, text: string) => Promise<void>;
}

export const useChatPlayback = (): ChatPlaybackReturn => {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState({
    speakingMessageId: getSpeakingMessageId(),
    isPaused: isTtsPaused(),
  });
  const activePlayer = useAudioPlayer(null);
  const activePlayerStatus = useAudioPlayerStatus(activePlayer);

  useEffect(() => subscribeTtsState((speakingMessageId, isPaused) => {
    setTtsState({ speakingMessageId, isPaused });
  }), []);

  const stopPlayback = useCallback((): void => {
    try {
      activePlayer.pause();
    } catch {
      // The native player may already be released.
    }
    setPlayingMessageId(null);
    stopSpeaking();
  }, [activePlayer]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (nextState === 'background' || nextState === 'inactive') stopPlayback();
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [stopPlayback]);

  useEffect(() => () => {
    try {
      activePlayer.pause();
    } catch {
      // The native player may already be released.
    }
    stopSpeaking();
  }, [activePlayer]);

  const handlePlayPauseMessage = useCallback((messageId: string, uri: string): void => {
    stopSpeaking();
    if (playingMessageId === messageId) {
      if (activePlayerStatus.playing) {
        activePlayer.pause();
      } else {
        if (
          activePlayerStatus.duration > 0
          && activePlayerStatus.currentTime >= activePlayerStatus.duration - 0.1
        ) {
          activePlayer.seekTo(0);
        }
        activePlayer.play();
      }
      return;
    }
    setPlayingMessageId(messageId);
    activePlayer.replace(uri);
    activePlayer.play();
  }, [activePlayer, activePlayerStatus, playingMessageId]);

  const handleSeekMessage = useCallback((messageId: string, percentage: number): void => {
    if (playingMessageId !== messageId || activePlayerStatus.duration <= 0) return;
    activePlayer.seekTo(percentage * activePlayerStatus.duration);
  }, [activePlayer, activePlayerStatus.duration, playingMessageId]);

  const handleToggleSpeech = useCallback(async (messageId: string, text: string): Promise<void> => {
    try {
      activePlayer.pause();
    } catch {
      // The native player may already be released.
    }
    setPlayingMessageId(null);
    await toggleMessageSpeech(messageId, text);
  }, [activePlayer]);

  return {
    playingMessageId,
    ttsState,
    activePlayerStatus,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
  };
};
