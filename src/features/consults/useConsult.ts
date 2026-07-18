import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { ChatMessage } from '@/src/utils/consultCache';
import { consultService } from '@/src/services/consults/consultService';
import { FlashListRef } from '@shopify/flash-list';
import {
  getSpeakingMessageId,
  isTtsPaused,
  stopSpeaking as stopTts,
  subscribeTtsState,
  toggleMessageSpeech,
} from '@/src/utils/ttsManager';
import { settingsStorage } from '@/src/services/settings/settingsStorage';
import { createChatFormData } from '@/src/features/consults/chatFormData';

interface UseConsultParams {
  sessionId: string | null;
  familyMemberId: string | null;
  onSessionCreated: (sessionId: string) => void;
}

interface UseConsultReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  playingMessageId: string | null;
  ttsState: { speakingMessageId: string | null; isPaused: boolean };
  activePlayerStatus: ReturnType<typeof useAudioPlayerStatus>;
  flashListRef: RefObject<FlashListRef<ChatMessage> | null>;
  handleSend: (
    text: string,
    audioFile: DocumentPicker.DocumentPickerAsset | null,
    docs: DocumentPicker.DocumentPickerAsset[]
  ) => Promise<void>;
  handlePlayPauseMessage: (messageId: string, uri: string) => void;
  handleSeekMessage: (messageId: string, percentage: number) => void;
  handleToggleSpeech: (messageId: string, text: string) => Promise<void>;
}

export const useConsult = ({
  sessionId,
  familyMemberId,
  onSessionCreated,
}: UseConsultParams): UseConsultReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(sessionId !== null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const activeSessionIdRef = useRef(sessionId);

  // TTS state — synced from the module singleton via a subscriber
  const [ttsState, setTtsState] = useState({
    speakingMessageId: getSpeakingMessageId(),
    isPaused: isTtsPaused(),
  });

  // Centralized Audio Player
  const activePlayer = useAudioPlayer(null);
  const activePlayerStatus = useAudioPlayerStatus(activePlayer);

  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);

  // Subscribe to TTS speaking state changes
  useEffect(() => {
    const unsub = subscribeTtsState((id, isPaused) => {
      setTtsState({ speakingMessageId: id, isPaused });
    });
    return unsub;
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSession = async (): Promise<void> => {
      activeSessionIdRef.current = sessionId;
      setError(null);
      setPlayingMessageId(null);
      if (!sessionId) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const session = await consultService.getSession(sessionId);
        if (!isActive) return;
        const history = session.messages.flatMap<ChatMessage>((message) => {
          const result: ChatMessage[] = [];
          if (message.question) {
            result.push({
              id: `${message.id}-question`,
              text: message.question,
              sender: 'user',
              timestamp: message.question_time ? new Date(message.question_time) : new Date(),
            });
          }
          if (message.answer) {
            result.push({
              id: `${message.id}-answer`,
              text: message.answer,
              sender: 'bot',
              timestamp: message.answer_time ? new Date(message.answer_time) : new Date(),
            });
          }
          return result;
        });
        setMessages(history);
      } catch (err: unknown) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load consult history');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      isActive = false;
    };
  }, [sessionId, familyMemberId]);

  useEffect(() => {
    return () => {
      try {
        activePlayer.pause();
      } catch {
        // Player may already be released.
      }
      stopTts();
    };
  }, [activePlayer]);

  // AppState listener: pause audio + stop TTS on background/inactive
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        try {
          activePlayer.pause();
        } catch {
          // Safe catch in case player is already released
        }
        stopTts();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [activePlayer]);

  // Auto-scroll to bottom after rendering or message changes
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        if (flashListRef.current) {
          flashListRef.current.scrollToEnd({ animated: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Auto scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    const currentRef = flashListRef.current;
    if (currentRef) {
      setTimeout(() => {
        currentRef.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  const handlePlayPauseMessage = useCallback((messageId: string, uri: string) => {
    // Stop TTS before playing recorded audio
    stopTts();

    if (playingMessageId === messageId) {
      if (activePlayerStatus.playing) {
        activePlayer.pause();
      } else {
        if (activePlayerStatus.duration > 0 && activePlayerStatus.currentTime >= activePlayerStatus.duration - 0.1) {
          activePlayer.seekTo(0);
        }
        activePlayer.play();
      }
    } else {
      setPlayingMessageId(messageId);
      activePlayer.replace(uri);
      activePlayer.play();
    }
  }, [playingMessageId, activePlayerStatus.playing, activePlayerStatus.currentTime, activePlayerStatus.duration, activePlayer]);

  const handleSeekMessage = useCallback((messageId: string, percentage: number) => {
    if (playingMessageId === messageId && activePlayerStatus.duration > 0) {
      const targetSeconds = percentage * activePlayerStatus.duration;
      activePlayer.seekTo(targetSeconds);
    }
  }, [playingMessageId, activePlayerStatus.duration, activePlayer]);

  /** Toggle TTS speech for a bot message. Stops audio playback first. */
  const handleToggleSpeech = useCallback(async (messageId: string, text: string) => {
    // Stop audio player before TTS to avoid overlap
    try {
      activePlayer.pause();
    } catch { /* ignore */ }
    setPlayingMessageId(null);

    await toggleMessageSpeech(messageId, text);
  }, [activePlayer]);

  const handleSend = useCallback(async (
    text: string,
    audioFile: DocumentPicker.DocumentPickerAsset | null,
    docs: DocumentPicker.DocumentPickerAsset[]
  ) => {
    if (isProcessing) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      timestamp: new Date(),
      audio_uri: audioFile?.uri || null,
      documents: docs.map(d => ({ name: d.name, size: d.size })),
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();
    setIsProcessing(true);

    try {
      const formData = await createChatFormData({
        question: text,
        familyMemberId,
        audioFile,
        documents: docs,
        sessionId: activeSessionIdRef.current,
      });

      const res = await consultService.sendMessage(formData);
      if (!activeSessionIdRef.current) {
        activeSessionIdRef.current = res.session_id;
        onSessionCreated(res.session_id);
      }

      const botMessage: ChatMessage = {
        id: `${res.message_id}-answer`,
        text: res.answer || "Sorry, I couldn't formulate a response.",
        sender: 'bot',
        timestamp: new Date(res.answer_time),
      };

      setMessages((prev) => [
        ...prev.map((message) => message.id === userMessage.id ? {
          ...message,
          id: `${res.message_id}-question`,
          timestamp: new Date(res.question_time),
        } : message),
        botMessage,
      ]);
      const isMuted = await settingsStorage.getMuteBotSpeech();
      if (!isMuted) {
        handleToggleSpeech(botMessage.id, botMessage.text);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error communicating with assistant';
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Error: ${message}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
      const isMuted = await settingsStorage.getMuteBotSpeech();
      if (!isMuted) {
        handleToggleSpeech(errorMessage.id, errorMessage.text);
      }
    } finally {
      setIsProcessing(false);
      scrollToBottom();
    }
  }, [familyMemberId, isProcessing, scrollToBottom, handleToggleSpeech, onSessionCreated]);

  return {
    messages,
    isLoading,
    isProcessing,
    error,
    playingMessageId,
    ttsState,
    activePlayerStatus,
    flashListRef,
    handleSend,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
  };
};
