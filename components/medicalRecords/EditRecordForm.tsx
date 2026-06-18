import React from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { Icon } from '@/components/ui/Icon';
import { AudioNoteRecorder } from '@/components/medicalRecords/AudioNoteRecorder';
import { formatFileSize } from '@/src/utils/file';
import { styles } from './editRecordFormStyles';

interface EditRecordFormProps {
  visitDate: string;
  setVisitDate: (val: string) => void;
  primaryContext: string;
  setPrimaryContext: (val: string) => void;
  chiefComplaint: string;
  setChiefComplaint: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  editError: string | null;
  newDocuments: DocumentPicker.DocumentPickerAsset[];
  handlePickNewDocuments: () => void;
  removeNewDocument: (idx: number) => void;
  newAudioFile: DocumentPicker.DocumentPickerAsset | null;
  setNewAudioFile: (val: DocumentPicker.DocumentPickerAsset | null) => void;
  handleBack: () => void;
  handleSave: () => void;
  isPending: boolean;
}

export const EditRecordForm: React.FC<EditRecordFormProps> = ({
  visitDate,
  setVisitDate,
  primaryContext,
  setPrimaryContext,
  chiefComplaint,
  setChiefComplaint,
  notes,
  setNotes,
  editError,
  newDocuments,
  handlePickNewDocuments,
  removeNewDocument,
  newAudioFile,
  setNewAudioFile,
  handleBack,
  handleSave,
  isPending,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ gap: theme.spacing.lg }}>
      {editError ? (
        <View style={styles.errorBanner}>
          <Typography.Label style={styles.errorBannerText}>
            {editError}
          </Typography.Label>
        </View>
      ) : null}

      <View style={styles.cardForm}>
        <DateInput
          label="Visit Date"
          value={visitDate}
          onChangeText={setVisitDate}
        />

        <TextInput
          label="Primary Context / Location"
          placeholder="e.g. City General Hospital"
          value={primaryContext}
          onChangeText={setPrimaryContext}
        />

        <TextInput
          label="Chief Complaint"
          placeholder="e.g. Cough and cold"
          value={chiefComplaint}
          onChangeText={setChiefComplaint}
        />

        <TextInput
          label="Notes"
          placeholder="Additional details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />

        {/* New Attachments Section */}
        <View style={styles.editAttachmentsSection}>
          <Typography.Label style={styles.editAttachmentsLabel}>Add New Attachments</Typography.Label>

          {/* Document Picker */}
          <Pressable
            onPress={handlePickNewDocuments}
            style={({ pressed }) => [
              styles.editAttachButton,
              pressed ? styles.editAttachButtonPressed : null,
            ]}
          >
            <Icon name="doc.fill" size={16} tintColor={theme.colors.primary.DEFAULT} />
            <Typography.Label style={styles.editAttachButtonText}>Add Documents</Typography.Label>
          </Pressable>

          {newDocuments.length > 0 ? (
            <View style={styles.editFileList}>
              {newDocuments.map((doc, idx) => (
                <Animated.View
                  key={`new-doc-${idx}-${doc.uri}`}
                  entering={FadeInDown.duration(200)}
                  style={styles.editFileItem}
                >
                  <View style={styles.editFileInfo}>
                    <Icon name="paperclip" size={14} tintColor={theme.colors.text.secondary} />
                    <View style={styles.editFileNameContainer}>
                      <Typography.Paragraph numberOfLines={1} style={styles.editFileName}>
                        {doc.name}
                      </Typography.Paragraph>
                      <Typography.Label style={styles.editFileSize}>
                        {formatFileSize(doc.size)}
                      </Typography.Label>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => removeNewDocument(idx)}
                    style={({ pressed }) => [
                      styles.editDeleteFileButton,
                      pressed ? styles.editDeleteFileButtonPressed : null,
                    ]}
                  >
                    <Icon name="xmark" size={12} tintColor={theme.colors.text.secondary} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Audio Note Recorder */}
          <View style={styles.editAudioSection}>
            <Typography.Label style={styles.editAudioLabel}>Audio Note</Typography.Label>
            <AudioNoteRecorder
              audioFile={newAudioFile}
              onAudioChange={setNewAudioFile}
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button.Secondary
            title="Cancel"
            onPress={handleBack}
            style={styles.flexHalf}
          />
          <Button.Primary
            title="Save Changes"
            onPress={handleSave}
            loading={isPending}
            style={styles.flexHalf}
          />
        </View>
      </View>
    </Animated.View>
  );
};
