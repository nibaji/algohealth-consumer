import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { ChatMessage, consultCache } from '@/src/utils/consultCache';
import { medicalRecordService } from '@/src/services/medicalRecords/medicalRecordService';
import { FlashListRef } from '@shopify/flash-list';
import {
  getSpeakingMessageId,
  isTtsPaused,
  stopSpeaking as stopTts,
  subscribeTtsState,
  toggleMessageSpeech,
} from '@/src/utils/ttsManager';
import { uriToBlob } from '@/src/utils/file';
import { settingsStorage } from '@/src/services/settings/settingsStorage';

interface UseConsultParams {
  visible: boolean;
  member: FamilyMemberOut | null;
}

export const useConsult = ({ visible, member }: UseConsultParams) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Synced prop tracking state for render-time updates
  const [prevVisible, setPrevVisible] = useState(false);
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null);

  // Sync state synchronously during render when visibility or member changes
  if (visible !== prevVisible || (member && member.id !== prevMemberId)) {
    setPrevVisible(visible);
    setPrevMemberId(member ? member.id : null);

    if (visible && member) {
      const cached = consultCache.get(member.id);
      if (cached && cached.length > 0) {
        setMessages(cached);
      } else {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          text: `Hi! I am your Health Consultant, your AlgoHealth assistant. I have loaded ${member.name}'s medical records. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      setIsProcessing(false);
      setPlayingMessageId(null);
    } else if (!visible) {
      setPlayingMessageId(null);
    }
  }

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

  // Synchronize messages with cache
  useEffect(() => {
    if (member && messages.length > 0) {
      consultCache.set(member.id, messages);
    }
  }, [messages, member]);

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

  // Pause audio + stop TTS when modal becomes invisible (effects only)
  useEffect(() => {
    if (!visible) {
      try {
        activePlayer.pause();
      } catch {
        // Safe catch in case player is already released
      }
      stopTts();
    }
  }, [visible, activePlayer]);

  // Auto-scroll to bottom after rendering or message changes
  useEffect(() => {
    if (visible && member && messages.length > 0) {
      const timer = setTimeout(() => {
        if (flashListRef.current) {
          flashListRef.current.scrollToEnd({ animated: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible, member, messages.length]);

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
    if (!member || isProcessing) return;

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
      // Build FormData payload
      const formData = new FormData();
      formData.append('question', text);
      formData.append('family_member_id', member.id);

      // Append documents
      for (const doc of docs) {
        if (process.env.EXPO_OS === 'web') {
          const blob = await uriToBlob(doc.uri);
          formData.append('files', blob, doc.name);
        } else {
          formData.append('files', {
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || 'application/octet-stream',
          } as unknown as Blob);
        }
      }

      // Append audio file
      if (audioFile) {
        if (process.env.EXPO_OS === 'web') {
          const blob = await uriToBlob(audioFile.uri);
          formData.append('audio_files', blob, audioFile.name);
        } else {
          formData.append('audio_files', {
            uri: audioFile.uri,
            name: audioFile.name,
            type: audioFile.mimeType || 'application/octet-stream',
          } as unknown as Blob);
        }
      }

      const res = await medicalRecordService.consult(formData);

      // Extract response text
      const botText = res.response || res.response_text || res.text || res.answer || "Sorry, I couldn't formulate a response.";

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
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
  }, [member, isProcessing, scrollToBottom, handleToggleSpeech]);

  return {
    messages,
    isProcessing,
    playingMessageId,
    ttsState,
    activePlayer,
    activePlayerStatus,
    flashListRef,
    handleSend,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
    scrollToBottom,
  };
};
