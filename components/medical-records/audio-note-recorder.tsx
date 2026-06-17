import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, AppState, AppStateStatus } from 'react-native';
import { theme } from '@/constants/theme';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync
} from 'expo-audio';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDuration = (millis: number): string => {
  const totalSeconds = millis / 1000;
  return formatTime(totalSeconds);
};

interface AudioNoteRecorderProps {
  audioFile: DocumentPicker.DocumentPickerAsset | null;
  onAudioChange: (file: DocumentPicker.DocumentPickerAsset | null) => void;
  containerStyle?: any;
  variant?: 'form' | 'chat';
  startRecordingOnInit?: boolean;
}

export const AudioNoteRecorder: React.FC<AudioNoteRecorderProps> = React.memo(({
  audioFile,
  onAudioChange,
  containerStyle,
  variant = 'form',
  startRecordingOnInit = false,
}) => {
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Audio Note Recording states & hooks
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recordingUri = audioFile?.uri || null;
  
  const player = useAudioPlayer(recordingUri);
  const playerStatus = useAudioPlayerStatus(player);

  // Pulse animation for recording state
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (recorderState.isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1.0, { duration: 200 });
    }
  }, [recorderState.isRecording, pulseScale]);

  const pulsingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: recorderState.isRecording ? 0.8 : 1.0,
    };
  });

  // Sync player source when uri changes
  useEffect(() => {
    if (recordingUri) {
      player.replace(recordingUri);
    }
  }, [recordingUri, player]);

  // AppState listener and unmount cleanup to pause player
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        try {
          player.pause();
        } catch {}
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await getRecordingPermissionsAsync();
      let granted = permission.granted;
      
      if (!granted) {
        const request = await requestRecordingPermissionsAsync();
        granted = request.granted;
      }
      
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio notes');
        return;
      }
      
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to access microphone or start recording');
    }
  }, [audioRecorder]);

  // Automatically start recording if startRecordingOnInit is set
  useEffect(() => {
    if (startRecordingOnInit && !recorderState.isRecording && !audioFile) {
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRecordingOnInit]);

  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        onAudioChange({
          uri: audioRecorder.uri,
          name: 'audio_note.m4a',
          mimeType: 'audio/m4a',
          size: 0,
        } as any);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to save audio recording');
    }
  }, [audioRecorder, onAudioChange]);

  const handleRemoveAudio = useCallback(() => {
    try {
      if (playerStatus.playing) {
        player.pause();
      }
    } catch {}
    onAudioChange(null);
  }, [player, playerStatus.playing, onAudioChange]);

  const handlePlayPause = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      if (playerStatus.duration > 0 && playerStatus.currentTime >= playerStatus.duration - 0.1) {
        player.seekTo(0);
      }
      player.play();
    }
  }, [player, playerStatus.playing, playerStatus.duration, playerStatus.currentTime]);

  const handleProgressBarLayout = useCallback((e: any) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const handleProgressBarPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0 && playerStatus.duration > 0) {
      const percentage = locationX / progressBarWidth;
      const targetSeconds = percentage * playerStatus.duration;
      player.seekTo(targetSeconds);
    }
  }, [progressBarWidth, playerStatus.duration, player]);

  const isRecorded = !!audioFile;
  const isChat = variant === 'chat';

  return (
    <View style={[styles.container, containerStyle]}>
      {!isRecorded ? (
        // Recording State: Idle or Recording
        <View style={isChat ? styles.recorderPanelChat : styles.recorderPanel}>
          {recorderState.isRecording ? (
            <View style={styles.recordingStateRow}>
              {/* Pulsing indicator */}
              <Animated.View style={[styles.pulseCircle, pulsingStyle]}>
                <Icon name="mic.fill" size={20} tintColor="#EF4444" />
              </Animated.View>
              
              <View style={styles.recordingTimerContainer}>
                <Typography.Paragraph style={styles.recordingText}>
                  Recording...
                </Typography.Paragraph>
                <Typography.Label style={styles.recordingDuration}>
                  {formatDuration(recorderState.durationMillis)}
                </Typography.Label>
              </View>

              <Pressable
                onPress={stopRecording}
                style={({ pressed }) => [
                  styles.stopButton,
                  pressed ? styles.stopButtonPressed : null,
                ]}
              >
                <View style={styles.stopIconSquare} />
              </Pressable>
            </View>
          ) : (
            // Only show Idle UI for non-chat layout
            !isChat ? (
              <View style={styles.idleStateRow}>
                <Pressable
                  onPress={startRecording}
                  style={({ pressed }) => [
                    styles.recordMicButton,
                    pressed ? styles.recordMicButtonPressed : null,
                  ]}
                >
                  <Icon name="mic.fill" size={24} tintColor="#FFF" />
                </Pressable>
                <View style={styles.idleTextContainer}>
                  <Typography.Paragraph style={styles.audioNoteTitle}>
                    Record Audio
                  </Typography.Paragraph>
                  <Typography.Label style={styles.audioNoteSubtitle}>
                    Tap microphone to start recording
                  </Typography.Label>
                </View>
              </View>
            ) : null
          )}
        </View>
      ) : (
        // Playback State: Played / Paused
        <View style={isChat ? styles.playerPanelChat : styles.playerPanel}>
          <View style={styles.playerControlsRow}>
            <Pressable
              onPress={handlePlayPause}
              style={({ pressed }) => [
                styles.playPauseButton,
                pressed ? styles.playPauseButtonPressed : null,
              ]}
            >
              <Icon 
                name={playerStatus.playing ? 'pause.fill' : 'play.fill'} 
                size={18} 
                tintColor={theme.colors.primary.DEFAULT} 
              />
            </Pressable>

            <View style={styles.seekerContainer}>
              {/* Seeker Progress Bar */}
              <Pressable
                onLayout={handleProgressBarLayout}
                onPress={handleProgressBarPress}
                style={styles.progressBarBg}
              >
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${playerStatus.duration > 0 
                        ? (playerStatus.currentTime / playerStatus.duration) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressBarThumb, 
                    { 
                      left: `${playerStatus.duration > 0 
                        ? (playerStatus.currentTime / playerStatus.duration) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
              </Pressable>
              
              <View style={styles.timeLabelRow}>
                <Typography.Label style={styles.timeLabel}>
                  {formatTime(playerStatus.currentTime)}
                </Typography.Label>
                <Typography.Label style={styles.timeLabel}>
                  {formatTime(playerStatus.duration)}
                </Typography.Label>
              </View>
            </View>

            <Pressable
              onPress={handleRemoveAudio}
              style={({ pressed }) => [
                styles.deleteAudioButton,
                pressed ? styles.deleteAudioButtonPressed : null,
              ]}
            >
              <Icon name="trash.fill" size={16} tintColor={theme.colors.text.secondary} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
});

AudioNoteRecorder.displayName = 'AudioNoteRecorder';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  recorderPanel: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
  },
  recorderPanelChat: {
    backgroundColor: 'transparent',
    padding: 0,
    width: '100%',
  },
  idleStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  recordMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  recordMicButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  idleTextContainer: {
    flex: 1,
    gap: 2,
  },
  audioNoteTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  audioNoteSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  recordingStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pulseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTimerContainer: {
    flex: 1,
    gap: 2,
  },
  recordingText: {
    fontSize: theme.fontSize.sm,
    color: '#EF4444',
    fontWeight: '600',
  },
  recordingDuration: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonPressed: {
    opacity: 0.8,
  },
  stopIconSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  playerPanel: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
  },
  playerPanelChat: {
    backgroundColor: 'transparent',
    padding: 0,
    width: '100%',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButtonPressed: {
    opacity: 0.7,
  },
  seekerContainer: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    insetBlock: theme.spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border.light,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  progressBarThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.DEFAULT,
    position: 'absolute',
    marginLeft: -6,
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  deleteAudioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAudioButtonPressed: {
    opacity: 0.7,
  },
});
