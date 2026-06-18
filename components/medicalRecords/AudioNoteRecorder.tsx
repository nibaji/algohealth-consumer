import React from 'react';
import { View, Pressable } from 'react-native';
import { styles } from './audioNoteRecorderStyles';
import { theme } from '@/constants/theme';
import { Icon } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import Animated from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioNoteRecording } from '@/src/features/medicalRecords/useAudioNoteRecording';
import { formatTime, formatDuration } from '@/src/utils/time';

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
  const {
    recorderState,
    playerStatus,
    pulsingStyle,
    startRecording,
    stopRecording,
    handleRemoveAudio,
    handlePlayPause,
    handleProgressBarLayout,
    handleProgressBarPress,
  } = useAudioNoteRecording({
    audioFile,
    onAudioChange,
    startRecordingOnInit,
  });

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
