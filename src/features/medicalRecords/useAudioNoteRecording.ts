import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAlert } from '@/src/contexts/AlertContext';
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

interface UseAudioNoteRecordingParams {
  audioFile: DocumentPicker.DocumentPickerAsset | null;
  onAudioChange: (file: DocumentPicker.DocumentPickerAsset | null) => void;
  startRecordingOnInit?: boolean;
}

export const useAudioNoteRecording = ({
  audioFile,
  onAudioChange,
  startRecordingOnInit = false,
}: UseAudioNoteRecordingParams) => {
  const { showAlert } = useAlert();
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recordingUri = audioFile?.uri || null;
  
  const player = useAudioPlayer(recordingUri);
  const playerStatus = useAudioPlayerStatus(player);

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

  const pulsingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: recorderState.isRecording ? 0.8 : 1.0,
  }));

  useEffect(() => {
    if (recordingUri) {
      player.replace(recordingUri);
    }
  }, [recordingUri, player]);

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
        showAlert({
          title: 'Permission Required',
          message: 'Microphone permission is required to record audio notes',
          variant: 'warning',
        });
        return;
      }
      
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('Failed to start recording', err);
      showAlert({
        title: 'Error',
        message: 'Failed to access microphone or start recording',
        variant: 'danger',
      });
    }
  }, [audioRecorder, showAlert]);

  useEffect(() => {
    if (startRecordingOnInit && !recorderState.isRecording && !audioFile) {
      startRecording();
    }
  }, [startRecordingOnInit, recorderState.isRecording, audioFile, startRecording]);

  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        onAudioChange({
          uri: audioRecorder.uri,
          name: 'audio_note.m4a',
          mimeType: 'audio/m4a',
          size: 0,
          lastModified: Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      showAlert({
        title: 'Error',
        message: 'Failed to save audio recording',
        variant: 'danger',
      });
    }
  }, [audioRecorder, onAudioChange, showAlert]);

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

  const handleProgressBarLayout = useCallback((e: LayoutChangeEvent) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const handleProgressBarPress = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    if (progressBarWidth > 0 && playerStatus.duration > 0) {
      const percentage = locationX / progressBarWidth;
      const targetSeconds = percentage * playerStatus.duration;
      player.seekTo(targetSeconds);
    }
  }, [progressBarWidth, playerStatus.duration, player]);

  return {
    recorderState,
    playerStatus,
    pulsingStyle,
    progressBarWidth,
    startRecording,
    stopRecording,
    handleRemoveAudio,
    handlePlayPause,
    handleProgressBarLayout,
    handleProgressBarPress,
  };
};
