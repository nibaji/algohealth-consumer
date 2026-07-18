import { FlashListRef } from '@shopify/flash-list';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createChatFormData } from '@/src/features/consults/chatFormData';
import { useChatPlayback } from '@/src/features/consults/useChatPlayback';
import { askBenishService } from '@/src/services/consults/askBenishService';
import { settingsStorage } from '@/src/services/settings/settingsStorage';
import { ChatMessage } from '@/src/utils/consultCache';

interface UseAskBenishReturn extends ReturnType<typeof useChatPlayback> {
  messages: ChatMessage[];
  isProcessing: boolean;
  flashListRef: React.RefObject<FlashListRef<ChatMessage> | null>;
  handleSend: (
    text: string,
    audioFile: DocumentPicker.DocumentPickerAsset | null,
    documents: DocumentPicker.DocumentPickerAsset[]
  ) => Promise<void>;
}

export const useAskBenish = (): UseAskBenishReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);
  const requestVersionRef = useRef(0);
  const playback = useChatPlayback();
  const { handleToggleSpeech } = playback;

  const scrollToBottom = useCallback((): void => {
    const list = flashListRef.current;
    if (!list) return;
    setTimeout(() => list.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => () => {
    requestVersionRef.current += 1;
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  const handleSend = useCallback(async (
    text: string,
    audioFile: DocumentPicker.DocumentPickerAsset | null,
    documents: DocumentPicker.DocumentPickerAsset[]
  ): Promise<void> => {
    if (isProcessing) return;
    const version = requestVersionRef.current;
    const userMessage: ChatMessage = {
      id: `ask-user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
      audio_uri: audioFile?.uri || null,
      documents: documents.map((document) => ({ name: document.name, size: document.size })),
    };
    setMessages((current) => [...current, userMessage]);
    setIsProcessing(true);
    scrollToBottom();

    try {
      const formData = await createChatFormData({
        question: text,
        familyMemberId: null,
        audioFile,
        documents,
      });
      const response = await askBenishService.ask(formData);
      if (requestVersionRef.current !== version) return;
      const botMessage: ChatMessage = {
        id: `ask-bot-${Date.now()}`,
        text: response.answer || "Sorry, I couldn't formulate a response.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((current) => [...current, botMessage]);
      const isMuted = await settingsStorage.getMuteBotSpeech();
      if (requestVersionRef.current === version && !isMuted) {
        await handleToggleSpeech(botMessage.id, botMessage.text);
      }
    } catch (error: unknown) {
      if (requestVersionRef.current !== version) return;
      const detail = error instanceof Error ? error.message : 'Error communicating with assistant';
      const errorMessage: ChatMessage = {
        id: `ask-error-${Date.now()}`,
        text: `Error: ${detail}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((current) => [...current, errorMessage]);
      const isMuted = await settingsStorage.getMuteBotSpeech();
      if (requestVersionRef.current === version && !isMuted) {
        await handleToggleSpeech(errorMessage.id, errorMessage.text);
      }
    } finally {
      if (requestVersionRef.current === version) {
        setIsProcessing(false);
        scrollToBottom();
      }
    }
  }, [handleToggleSpeech, isProcessing, scrollToBottom]);

  return { messages, isProcessing, flashListRef, handleSend, ...playback };
};
