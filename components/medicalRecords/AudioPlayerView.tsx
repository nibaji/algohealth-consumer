import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { formatTime } from '@/src/utils/time';

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

  const handleProgressBarLayout = useCallback((e: LayoutChangeEvent) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const handleProgressBarPress = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0) {
      const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
      onSeek(percentage);
    }
  }, [progressBarWidth, onSeek]);

  const isUser = variant === 'user';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.playerContainer}>
      <Pressable
        onPress={onPlayPause}
        style={[styles.playPauseBtn, isUser ? styles.playPauseBtnUser : styles.playPauseBtnDefault]}
      >
        <Icon 
          name={isPlaying ? IconName.PauseFill : IconName.PlayFill} 
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
          <View 
            style={[
              styles.progressBarThumb,
              isUser ? styles.progressBarThumbUser : styles.progressBarThumbDefault,
              { left: `${Math.max(0, Math.min(100, progressPercent))}%` }
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
            name={IconName.TrashFill} 
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
    gap: theme.spacing.md,
    width: '100%',
    paddingVertical: theme.spacing.xs,
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
    backgroundColor: theme.colors.background.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
  },
  playerSeeker: {
    flex: 1,
    gap: 6,
    insetBlock: theme.spacing.xs,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  progressBarBgUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarBgDefault: {
    backgroundColor: theme.colors.border.light,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  progressBarFillUser: {
    backgroundColor: '#FFFFFF',
  },
  progressBarFillDefault: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  progressBarThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    marginLeft: -6,
  },
  progressBarThumbUser: {
    backgroundColor: '#FFFFFF',
  },
  progressBarThumbDefault: {
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
