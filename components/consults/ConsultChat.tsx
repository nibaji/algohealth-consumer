import React, { useCallback } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { ConsultInput } from '@/components/medicalRecords/ConsultInput';
import { ConsultMessage } from '@/components/medicalRecords/ConsultMessage';
import { ChatMessageBotSkeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useConsult } from '@/src/features/medicalRecords/useConsult';
import { ChatMessage } from '@/src/utils/consultCache';

interface ConsultChatProps {
  sessionId: string | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
  onSessionCreated: (sessionId: string) => void;
}

export const ConsultChat = React.memo(({
  sessionId,
  familyMemberId,
  familyMemberName,
  onSessionCreated,
}: ConsultChatProps): React.JSX.Element => {
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const {
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
  } = useConsult({ sessionId, familyMemberId, familyMemberName, onSessionCreated });

  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }): React.JSX.Element => {
    const isCurrentPlaying = playingMessageId === item.id;
    const isSpeaking = ttsState.speakingMessageId === item.id && !ttsState.isPaused;
    const isPaused = ttsState.speakingMessageId === item.id && ttsState.isPaused;
    return (
      <ConsultMessage
        item={item}
        isPlaying={isCurrentPlaying ? activePlayerStatus.playing : false}
        currentTime={isCurrentPlaying ? activePlayerStatus.currentTime : 0}
        duration={isCurrentPlaying ? activePlayerStatus.duration : (item.audio_duration || 0)}
        onPlayPause={handlePlayPauseMessage}
        onSeek={handleSeekMessage}
        isSpeaking={isSpeaking}
        isSpeechPaused={isPaused}
        onToggleSpeech={handleToggleSpeech}
      />
    );
  }, [
    playingMessageId,
    activePlayerStatus.playing,
    activePlayerStatus.currentTime,
    activePlayerStatus.duration,
    ttsState,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
  ]);

  const keyExtractor = useCallback((item: ChatMessage): string => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      enabled={keyboardAvoidingEnabled}
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary.DEFAULT} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Typography.Paragraph selectable style={styles.errorText}>{error}</Typography.Paragraph>
        </View>
      ) : (
        <View style={styles.chatArea}>
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            extraData={{ playingMessageId, activePlayerStatus, ttsState }}
          />
          {isProcessing ? (
            <View style={styles.processing}>
              <ChatMessageBotSkeleton />
            </View>
          ) : null}
        </View>
      )}
      <ConsultInput onSend={handleSend} disabled={isLoading || isProcessing || error !== null} />
    </KeyboardAvoidingView>
  );
});

ConsultChat.displayName = 'ConsultChat';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  chatArea: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  processing: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.text.error,
    textAlign: 'center',
  },
});
