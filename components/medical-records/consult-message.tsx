import React from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { ChatMessage } from '@/src/utils/consultCache';
import { AudioPlayerView } from './audio-player-view';

interface ConsultMessageProps {
  item: ChatMessage;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  onPlayPause: () => void;
  onSeek: (percentage: number) => void;
  // TTS props — only relevant for bot messages
  isSpeaking: boolean;
  isSpeechPaused: boolean;
  onToggleSpeech: () => void;
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
  const isUser = item.sender === 'user';
  const hasText = Boolean(item.text && item.text.trim() !== '');

  return (
    <View style={[styles.messageBubbleRow, isUser ? styles.rowUser : styles.rowBot]}>
      {isUser ? null : (
        <View style={[styles.botAvatarCircle, { borderCurve: 'continuous' }]}>
          <Icon name="sparkles" size={12} tintColor={theme.colors.primary.DEFAULT} />
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
          <View style={styles.audioPlayerWrapper}>
          <AudioPlayerView
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
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
                  name="doc.fill" 
                  size={12} 
                  tintColor={isUser ? '#FFFFFF' : theme.colors.primary.DEFAULT} 
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
              onPress={onToggleSpeech}
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
                    ? 'pause.fill'
                    : isSpeechPaused
                    ? 'play.fill'
                    : 'waveform'
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
    maxWidth: '85%',
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
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: 4,
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
    marginTop: 2,
  },
  bottomRowBot: {
    justifyContent: 'space-between',
  },
  bottomRowUser: {
    justifyContent: 'flex-end',
  },
  timeUser: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timeBot: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-start',
    marginTop: 2,
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
    backgroundColor: '#EEF2FF',
    borderColor: theme.colors.primary.DEFAULT + '50',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    color: '#FFFFFF',
  },
  docTextBot: {
    color: theme.colors.text.primary,
  },
  audioPlayerWrapper: { marginVertical: theme.spacing.sm, width: Dimensions.get('screen').width * 0.6 }
});
