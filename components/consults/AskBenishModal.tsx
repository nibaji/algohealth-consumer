import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConsultInput } from '@/components/medicalRecords/ConsultInput';
import { ConsultMessage } from '@/components/medicalRecords/ConsultMessage';
import { Icon, IconName } from '@/components/ui/Icon';
import { ChatMessageBotSkeleton } from '@/components/ui/Skeleton';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useAskBenish } from '@/src/features/consults/useAskBenish';
import { ChatMessage } from '@/src/utils/consultCache';

interface AskBenishModalProps {
  onClose: () => void;
}

export const AskBenishModal = React.memo(({
  onClose,
}: AskBenishModalProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const {
    messages,
    isProcessing,
    flashListRef,
    playingMessageId,
    ttsState,
    activePlayerStatus,
    handleSend,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
  } = useAskBenish();

  const renderMessage = useCallback(({ item }: { item: ChatMessage }): React.JSX.Element => {
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
    activePlayerStatus,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
    playingMessageId,
    ttsState,
  ]);

  const keyExtractor = useCallback((item: ChatMessage): string => item.id, []);
  const extraData = useMemo(
    () => ({ activePlayerStatus, playingMessageId, ttsState }),
    [activePlayerStatus, playingMessageId, ttsState]
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        enabled={keyboardAvoidingEnabled}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
          <View style={styles.headerText}>
            <Typography.Subheading style={styles.title}>Ask Benish</Typography.Subheading>
            <Typography.Label style={styles.subtitle}>General health query</Typography.Label>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close Ask Benish"
            style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}
          >
            <Icon name={IconName.Xmark} size={18} tintColor={theme.colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.chatArea}>
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            extraData={extraData}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          {isProcessing ? (
            <View style={styles.processing}>
              <ChatMessageBotSkeleton />
            </View>
          ) : null}
        </View>

        <ConsultInput onSend={handleSend} disabled={isProcessing} />
      </KeyboardAvoidingView>
    </Modal>
  );
});

AskBenishModal.displayName = 'AskBenishModal';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.default },
  header: {
    minHeight: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  headerText: { flex: 1, gap: theme.spacing.xxs },
  title: { color: theme.colors.text.primary, fontWeight: '700' },
  subtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSize.xs },
  closeButton: {
    width: theme.spacing['2xl'],
    height: theme.spacing['2xl'],
    borderRadius: theme.radius.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
  },
  closeButtonPressed: { opacity: 0.7 },
  chatArea: { flex: 1, width: '100%', overflow: 'hidden' },
  listContent: { padding: theme.spacing.lg },
  processing: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
});
