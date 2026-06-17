import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
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

interface ConsultInputProps {
  onSend: (text: string, audioFile: DocumentPicker.DocumentPickerAsset | null, documents: DocumentPicker.DocumentPickerAsset[]) => void;
  disabled?: boolean;
}

export const ConsultInput: React.FC<ConsultInputProps> = React.memo(({ onSend, disabled }) => {
  const [inputText, setInputText] = useState('');
  const [documents, setDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Audio Recorder setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recordingUri = audioFile?.uri || null;

  // Audio Player setup
  const player = useAudioPlayer(recordingUri);
  const playerStatus = useAudioPlayerStatus(player);

  const pulseScale = useSharedValue(1);

  // Pulse animation for recording state
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
      opacity: recorderState.isRecording ? 0.6 : 1.0,
    };
  });

  // Sync player source when uri changes
  useEffect(() => {
    if (recordingUri) {
      player.replace(recordingUri);
    }
  }, [recordingUri, player]);

  const handlePickDocuments = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        setDocuments(prev => {
          const existingKeys = new Set(prev.map(doc => `${doc.name}-${doc.size}`));
          const uniqueNewAssets = [];
          for (const asset of result.assets) {
            const key = `${asset.name}-${asset.size}`;
            if (!existingKeys.has(key)) {
              uniqueNewAssets.push(asset);
              existingKeys.add(key);
            }
          }
          return [...prev, ...uniqueNewAssets];
        });
      }
    } catch (err) {
      console.error('Failed to pick documents', err);
    }
  }, []);

  const removeDocument = useCallback((indexToRemove: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== indexToRemove));
  }, []);

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
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        setAudioFile({
          uri: audioRecorder.uri,
          name: 'audio_note.m4a',
          mimeType: 'audio/m4a',
          size: 0,
        } as any);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  }, [audioRecorder]);

  const handleRemoveAudio = useCallback(() => {
    if (player.playing) {
      player.pause();
    }
    setAudioFile(null);
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, playerStatus.playing]);

  const handleSend = useCallback(() => {
    const textToSend = inputText.trim();
    if (!textToSend && !audioFile && documents.length === 0) return;

    onSend(textToSend, audioFile, documents);
    
    // Clear input states
    setInputText('');
    setDocuments([]);
    setAudioFile(null);
  }, [inputText, audioFile, documents, onSend]);

  const hasAttachments = documents.length > 0 || !!audioFile;

  return (
    <View style={styles.inputContainer}>
      {/* List of picked documents and audio notes */}
      {hasAttachments ? (
        <View style={styles.attachmentsArea}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attachmentsList}
          >
            {audioFile ? (
              <View style={[styles.attachmentChip, styles.audioChip, { borderCurve: 'continuous' }]}>
                <Pressable onPress={handlePlayPause} style={styles.chipPlayBtn}>
                  <Icon 
                    name={playerStatus.playing ? 'pause.fill' : 'play.fill'} 
                    size={10} 
                    tintColor={theme.colors.primary.DEFAULT} 
                  />
                </Pressable>
                <Typography.Label style={styles.attachmentLabel} numberOfLines={1}>
                  Voice Note ({formatTime(playerStatus.duration / 1000)})
                </Typography.Label>
                <Pressable onPress={handleRemoveAudio} style={styles.chipRemoveBtn}>
                  <Icon name="xmark" size={10} tintColor={theme.colors.text.tertiary} />
                </Pressable>
              </View>
            ) : null}

            {documents.map((doc, index) => (
              <View key={index} style={[styles.attachmentChip, { borderCurve: 'continuous' }]}>
                <Icon name="doc.fill" size={10} tintColor={theme.colors.text.secondary} />
                <Typography.Label style={styles.attachmentLabel} numberOfLines={1}>
                  {doc.name}
                </Typography.Label>
                <Pressable onPress={() => removeDocument(index)} style={styles.chipRemoveBtn}>
                  <Icon name="xmark" size={10} tintColor={theme.colors.text.tertiary} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Input bar */}
      <View style={styles.inputBar}>
        {recorderState.isRecording ? (
          <View style={styles.recordingRow}>
            <View style={styles.recordingStatus}>
              <Animated.View style={[styles.recordDot, pulsingStyle]} />
              <Typography.Paragraph style={styles.recordingText}>
                Recording... {formatTime(recorderState.durationMillis / 1000)}
              </Typography.Paragraph>
            </View>
            <Pressable 
              onPress={stopRecording}
              style={({ pressed }) => [
                styles.stopRecordingButton,
                pressed ? styles.actionButtonPressed : null,
                { borderCurve: 'continuous' }
              ]}
            >
              <Icon name="xmark" size={16} tintColor={theme.colors.status.error} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              onPress={handlePickDocuments}
              disabled={disabled}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed ? styles.actionBtnPressed : null,
                { borderCurve: 'continuous' }
              ]}
            >
              <Icon name="paperclip" size={18} tintColor={theme.colors.text.secondary} />
            </Pressable>

            <TextInput
              placeholder={audioFile ? 'Voice note attached' : 'Type or record a question...'}
              value={inputText}
              onChangeText={setInputText}
              style={[styles.textInput, { borderCurve: 'continuous' }]}
              placeholderTextColor={theme.colors.text.tertiary}
              editable={!disabled}
              multiline
              maxLength={500}
            />

            {!inputText.trim() && !audioFile && documents.length === 0 ? (
              <Pressable
                onPress={startRecording}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed ? styles.actionBtnPressed : null,
                  { borderCurve: 'continuous' }
                ]}
              >
                <Icon name="mic.fill" size={18} tintColor={theme.colors.primary.DEFAULT} />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSend}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.sendButton,
                  pressed ? styles.sendButtonPressed : null,
                  { borderCurve: 'continuous' }
                ]}
              >
                <Icon name="paperplane.fill" size={16} tintColor="#FFFFFF" />
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
});

ConsultInput.displayName = 'ConsultInput';

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  attachmentsArea: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  attachmentsList: {
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    maxWidth: 160,
  },
  audioChip: {
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF5FF',
  },
  chipPlayBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flexShrink: 1,
  },
  chipRemoveBtn: {
    padding: 2,
  },
  inputBar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPressed: {
    backgroundColor: theme.colors.background.default,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    height: 40,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.status.error,
  },
  recordingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.status.error,
    fontWeight: '600',
  },
  stopRecordingButton: {
    padding: 4,
  },
  actionButtonPressed: {
    opacity: 0.5,
  },
});
