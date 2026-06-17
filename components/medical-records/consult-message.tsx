import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { ChatMessage } from '@/src/utils/consultCache';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const MessageAudioPlayer = ({ uri }: { uri: string }) => {
  const player = useAudioPlayer(uri);
  const playerStatus = useAudioPlayerStatus(player);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const handlePlayPause = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, playerStatus.playing]);

  const handleProgressBarLayout = useCallback((e: any) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const handleProgressBarPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0 && playerStatus.duration > 0) {
      const percentage = locationX / progressBarWidth;
      const targetSeconds = percentage * (playerStatus.duration / 1000);
      player.seekTo(targetSeconds);
    }
  }, [progressBarWidth, playerStatus.duration, player]);

  const durationSecs = playerStatus.duration / 1000;
  const currentSecs = playerStatus.currentTime / 1000;

  return (
    <View style={styles.playerContainer}>
      <Pressable
        onPress={handlePlayPause}
        style={styles.playPauseBtn}
      >
        <Icon 
          name={playerStatus.playing ? 'pause.fill' : 'play.fill'} 
          size={16} 
          tintColor="#FFFFFF" 
        />
      </Pressable>

      <View style={styles.playerSeeker}>
        <Pressable
          onLayout={handleProgressBarLayout}
          onPress={handleProgressBarPress}
          style={styles.progressBarBg}
        >
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${durationSecs > 0 ? (currentSecs / durationSecs) * 100 : 0}%` 
              }
            ]} 
          />
        </Pressable>
        <View style={styles.timeLabelRow}>
          <Typography.Label style={styles.timeLabel}>
            {formatTime(currentSecs)}
          </Typography.Label>
          <Typography.Label style={styles.timeLabel}>
            {formatTime(durationSecs)}
          </Typography.Label>
        </View>
      </View>
    </View>
  );
};

interface ConsultMessageProps {
  item: ChatMessage;
}

export const ConsultMessage: React.FC<ConsultMessageProps> = React.memo(({ item }) => {
  const isUser = item.sender === 'user';

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
          <MessageAudioPlayer uri={item.audio_uri} />
        ) : null}

        {item.text ? (
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

        <Typography.Label style={isUser ? styles.timeUser : styles.timeBot}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Typography.Label>
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
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: 220,
    paddingVertical: theme.spacing.xs,
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSeeker: {
    flex: 1,
    gap: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
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
});
