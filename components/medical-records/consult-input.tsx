import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import { AudioNoteRecorder } from './audio-note-recorder';

interface ConsultInputProps {
  onSend: (text: string, audioFile: DocumentPicker.DocumentPickerAsset | null, documents: DocumentPicker.DocumentPickerAsset[]) => void;
  disabled?: boolean;
}

export const ConsultInput: React.FC<ConsultInputProps> = React.memo(({
  onSend,
  disabled,
}) => {
  const [inputText, setInputText] = useState('');
  const [documents, setDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [audioFile, setAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isRecordingMode, setIsRecordingMode] = useState(false);

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

  const handleSend = useCallback(() => {
    const textToSend = inputText.trim();
    if (!textToSend && !audioFile && documents.length === 0) return;

    onSend(textToSend, audioFile, documents);
    
    // Clear input states
    setInputText('');
    setDocuments([]);
    setAudioFile(null);
    setIsRecordingMode(false);
  }, [inputText, audioFile, documents, onSend]);

  return (
    <View style={styles.inputContainer}>
      {/* Picked attachments list */}
      {documents.length > 0 ? (
        <View style={styles.attachmentsArea}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attachmentsList}
          >
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
        {isRecordingMode ? (
          // Recording in progress: only show the recorder
          <View style={styles.recorderContainer}>
            <AudioNoteRecorder
              audioFile={audioFile}
              onAudioChange={(file) => {
                setAudioFile(file);
                setIsRecordingMode(false);
              }}
              variant="chat"
              startRecordingOnInit={true}
            />
          </View>
        ) : audioFile ? (
          // Recorded, showing playback: show paperclip, player, and send buttons
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

            <View style={styles.recorderContainer}>
              <AudioNoteRecorder
                audioFile={audioFile}
                onAudioChange={(file) => {
                  setAudioFile(file);
                  setIsRecordingMode(false);
                }}
                variant="chat"
              />
            </View>

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
          </>
        ) : (
          // Normal state: paperclip, text input, mic or send
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
              placeholder="Type or record a question..."
              value={inputText}
              onChangeText={setInputText}
              style={[styles.textInput, { borderCurve: 'continuous' }]}
              placeholderTextColor={theme.colors.text.tertiary}
              editable={!disabled}
              multiline
              maxLength={500}
            />

            {inputText.trim() !== '' ? (
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
            ) : (
              <Pressable
                onPress={() => setIsRecordingMode(true)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed ? styles.actionBtnPressed : null,
                  { borderCurve: 'continuous' }
                ]}
              >
                <Icon name="mic.fill" size={18} tintColor={theme.colors.primary.DEFAULT} />
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
  attachmentLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flexShrink: 1,
  },
  chipRemoveBtn: {
    padding: 2,
  },
  recorderContainer: {
    flex: 1,
    justifyContent: 'center',
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
});
