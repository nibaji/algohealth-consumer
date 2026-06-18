import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { Icon } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { ChatMessage } from '@/src/utils/consultCache';
import { useConsult } from '@/src/features/medicalRecords/useConsult';
import { ConsultInput } from './ConsultInput';
import { ConsultMessage } from './ConsultMessage';

interface ConsultModalProps {
  visible: boolean;
  onClose: () => void;
  member: FamilyMemberOut | null;
}

export const ConsultModal: React.FC<ConsultModalProps> = React.memo(({ visible, onClose, member }) => {
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  const {
    messages,
    isProcessing,
    playingMessageId,
    ttsState,
    activePlayerStatus,
    flashListRef,
    handleSend,
    handlePlayPauseMessage,
    handleSeekMessage,
    handleToggleSpeech,
  } = useConsult({ visible, member });

  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => {
    const isCurrentPlaying = playingMessageId === item.id;
    const isSpeaking = ttsState.speakingMessageId === item.id && !ttsState.isPaused;
    const isPaused = ttsState.speakingMessageId === item.id && ttsState.isPaused;
    return (
      <ConsultMessage
        item={item}
        isPlaying={isCurrentPlaying ? activePlayerStatus.playing : false}
        currentTime={isCurrentPlaying ? activePlayerStatus.currentTime : 0}
        duration={isCurrentPlaying ? activePlayerStatus.duration : (item.audio_duration || 0)}
        onPlayPause={() => {
          if (item.audio_uri) {
            handlePlayPauseMessage(item.id, item.audio_uri);
          }
        }}
        onSeek={(percentage) => handleSeekMessage(item.id, percentage)}
        isSpeaking={isSpeaking}
        isSpeechPaused={isPaused}
        onToggleSpeech={() => handleToggleSpeech(item.id, item.text || '')}
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

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (!member) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { paddingTop: insets.top, marginBottom: insets.bottom }]}
        behavior="padding"
        enabled={keyboardAvoidingEnabled}
        keyboardVerticalOffset={0}
      >
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Typography.Label style={styles.avatarText}>
                {member.name.charAt(0).toUpperCase()}
              </Typography.Label>
            </View>
            <View style={{ flex: 1 }}>
              <Typography.Subheading
                style={styles.headerTitle}
                truncate
              >
                Health Consultant
              </Typography.Subheading>
              <Typography.Label
                style={styles.headerSubtitle}
                truncate
              >
                Health AI • {member.name}
              </Typography.Label>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <Icon name="xmark" size={16} tintColor={theme.colors.text.primary} />
          </Pressable>
        </View>

        {/* Messages List */}
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
            <View style={styles.loadingBubbleRow}>
              <View style={[styles.botAvatarCircle, { borderCurve: 'continuous' }]}>
                <Icon name="sparkles" size={12} tintColor={theme.colors.primary.DEFAULT} />
              </View>
              <View style={[styles.loadingBubble, { borderCurve: 'continuous' }]}>
                <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
              </View>
            </View>
          ) : null}
        </View>

        {/* Input Bar */}
        <ConsultInput
          onSend={handleSend}
          disabled={isProcessing}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
});

ConsultModal.displayName = 'ConsultModal';

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  chatArea: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  botAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  loadingBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: 2,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
