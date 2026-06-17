import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

interface AudioPlayerViewProps {
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  onPlayPause: () => void;
  onSeek: (percentage: number) => void;
  onDelete?: () => void;
  variant?: 'user' | 'default';
}

export const AudioPlayerView: React.FC<AudioPlayerViewProps> = React.memo(({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onDelete,
  variant = 'default',
}) => {
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const handleProgressBarLayout = useCallback((e: any) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const handleProgressBarPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0) {
      const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
      onSeek(percentage);
    }
  }, [progressBarWidth, onSeek]);

  const isUser = variant === 'user';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.playerContainer, onDelete ? styles.playerContainerWide : null]}>
      <Pressable
        onPress={onPlayPause}
        style={[styles.playPauseBtn, isUser ? styles.playPauseBtnUser : styles.playPauseBtnDefault]}
      >
        <Icon 
          name={isPlaying ? 'pause.fill' : 'play.fill'} 
          size={16} 
          tintColor={isUser ? '#FFFFFF' : theme.colors.primary.DEFAULT} 
        />
      </Pressable>

      <View style={styles.playerSeeker}>
        <Pressable
          onLayout={handleProgressBarLayout}
          onPress={handleProgressBarPress}
          style={[styles.progressBarBg, isUser ? styles.progressBarBgUser : styles.progressBarBgDefault]}
        >
          <View 
            style={[
              styles.progressBarFill, 
              isUser ? styles.progressBarFillUser : styles.progressBarFillDefault,
              { width: `${Math.max(0, Math.min(100, progressPercent))}%` }
            ]} 
          />
        </Pressable>
        <View style={styles.timeLabelRow}>
          <Typography.Label style={[styles.timeLabel, isUser ? styles.timeLabelUser : styles.timeLabelDefault]}>
            {formatTime(currentTime)}
          </Typography.Label>
          <Typography.Label style={[styles.timeLabel, isUser ? styles.timeLabelUser : styles.timeLabelDefault]}>
            {formatTime(duration)}
          </Typography.Label>
        </View>
      </View>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed ? styles.deleteBtnPressed : null,
            { borderCurve: 'continuous' }
          ]}
        >
          <Icon 
            name="trash.fill" 
            size={14} 
            tintColor={isUser ? '#FFFFFF' : theme.colors.status.error} 
          />
        </Pressable>
      ) : null}
    </View>
  );
});

AudioPlayerView.displayName = 'AudioPlayerView';

const styles = StyleSheet.create({
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: 220,
    paddingVertical: theme.spacing.xs,
  },
  playerContainerWide: {
    width: '100%',
    paddingHorizontal: theme.spacing.xs,
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBtnUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playPauseBtnDefault: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  playerSeeker: {
    flex: 1,
    gap: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBgUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarBgDefault: {
    backgroundColor: theme.colors.border.light,
  },
  progressBarFill: {
    height: '100%',
  },
  progressBarFillUser: {
    backgroundColor: '#FFFFFF',
  },
  progressBarFillDefault: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 9,
  },
  timeLabelUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeLabelDefault: {
    color: theme.colors.text.tertiary,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnPressed: {
    opacity: 0.6,
  },
});
