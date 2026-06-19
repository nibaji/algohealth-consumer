import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { ChatMessage } from '@/src/utils/consultCache';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AudioPlayerView } from './AudioPlayerView';

interface ConsultMessageProps {
  item: ChatMessage;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  onPlayPause: (id: string, audioUri: string) => void;
  onSeek: (id: string, percentage: number) => void;
  // TTS props — only relevant for bot messages
  isSpeaking: boolean;
  isSpeechPaused: boolean;
  onToggleSpeech: (id: string, text: string) => void;
}

export const ConsultMessage: React.FC<ConsultMessageProps> = React.memo(({
  item,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  isSpeaking,
  isSpeechPaused,
  onToggleSpeech,
}) => {
  const { width } = useWindowDimensions();
  const isUser = item.sender === 'user';
  const hasText = Boolean(item.text && item.text.trim() !== '');

  const handlePlayPause = useCallback((): void => {
    if (item.audio_uri) {
      onPlayPause(item.id, item.audio_uri);
    }
  }, [item.id, item.audio_uri, onPlayPause]);

  const handleSeek = useCallback((percentage: number): void => {
    onSeek(item.id, percentage);
  }, [item.id, onSeek]);

  const handleToggleSpeech = useCallback((): void => {
    onToggleSpeech(item.id, item.text || '');
  }, [item.id, item.text, onToggleSpeech]);

  return (
    <View style={[styles.messageBubbleRow, isUser ? styles.rowUser : styles.rowBot, { maxWidth: width * 0.82 }]}>
      {isUser ? null : (
        <View style={[styles.botAvatarCircle, { borderCurve: 'continuous' }]}>
          <Icon name={IconName.Sparkles} size={12} tintColor={theme.colors.primary.DEFAULT} />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          { borderCurve: 'continuous' }
        ]}
      >
        {item.audio_uri ? (
          <View style={[styles.audioPlayerWrapper, { width: width * 0.6 }]}>
            <AudioPlayerView
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              variant="user"
            />
          </View>
        ) : null}

        {hasText ? (
          <Typography.Paragraph style={isUser ? styles.textUser : styles.textBot}>
            {item.text}
          </Typography.Paragraph>
        ) : null}

        {item.documents && item.documents.length > 0 ? (
          <View style={styles.documentsContainer}>
            {item.documents.map((doc, idx) => (
              <View key={idx} style={[styles.docChip, isUser ? styles.docChipUser : styles.docChipBot, { borderCurve: 'continuous' }]}>
                <Icon
                  name={IconName.DocFill}
                  size={12}
                  tintColor={isUser ? theme.colors.common.white : theme.colors.primary.DEFAULT}
                />
                <Typography.Label style={[styles.docText, isUser ? styles.docTextUser : styles.docTextBot]} numberOfLines={1}>
                  {doc.name}
                </Typography.Label>
              </View>
            ))}
          </View>
        ) : null}

        {/* Bottom row: timestamp + TTS button (bot only) */}
        <View style={[styles.bottomRow, isUser ? styles.bottomRowUser : styles.bottomRowBot]}>
          <Typography.Label style={isUser ? styles.timeUser : styles.timeBot}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Typography.Label>

          {/* Speak button — only for bot messages that have text */}
          {!isUser && hasText ? (
            <Pressable
              onPress={handleToggleSpeech}
              style={({ pressed }) => [
                styles.speakButton,
                (isSpeaking || isSpeechPaused) ? styles.speakButtonActive : null,
                pressed ? styles.speakButtonPressed : null,
                { borderCurve: 'continuous' },
              ]}
              accessibilityLabel={
                isSpeaking
                  ? 'Pause speaking'
                  : isSpeechPaused
                    ? 'Resume speaking'
                    : 'Read message aloud'
              }
            >
              <Icon
                name={
                  isSpeaking
                    ? IconName.PauseFill
                    : IconName.PlayFill
                }
                size={12}
                tintColor={
                  isSpeaking || isSpeechPaused
                    ? theme.colors.primary.DEFAULT
                    : theme.colors.text.tertiary
                }
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
});

ConsultMessage.displayName = 'ConsultMessage';

const styles = StyleSheet.create({
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    // maxWidth set inline via useWindowDimensions for reliable web behaviour
  },
  rowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  rowBot: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
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
  messageBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.xs,
    flexShrink: 1,      // allow bubble to shrink inside the row
    overflow: 'hidden', // prevent content from punching outside on web
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderBottomRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: 2,
  },
  textUser: {
    color: theme.colors.primary.content,
    lineHeight: theme.lineHeight.md,
  },
  textBot: {
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeight.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xxs,
  },
  bottomRowBot: {
    justifyContent: 'space-between',
  },
  bottomRowUser: {
    justifyContent: 'flex-end',
  },
  timeUser: {
    fontSize: theme.fontSize.tiny,
    color: theme.colors.translucent.white70,
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xxs,
  },
  timeBot: {
    fontSize: theme.fontSize.tiny,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xxs,
  },
  // Speak button
  speakButton: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  speakButtonActive: {
    backgroundColor: theme.colors.background.infoLight,
    borderColor: theme.colors.border.primaryLight,
  },
  speakButtonPressed: {
    opacity: 0.6,
  },
  documentsContainer: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    width: 220,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
  },
  docChipUser: {
    backgroundColor: theme.colors.translucent.white15,
    borderColor: theme.colors.translucent.white25,
  },
  docChipBot: {
    backgroundColor: theme.colors.background.default,
    borderColor: theme.colors.border.light,
  },
  docText: {
    fontSize: 11,
    flex: 1,
  },
  docTextUser: {
    color: theme.colors.common.white,
  },
  docTextBot: {
    color: theme.colors.text.primary,
  },
  audioPlayerWrapper: {
    marginVertical: theme.spacing.sm,
  },
});
