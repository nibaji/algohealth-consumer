import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput, validateDateString, inputDateToApiDate } from '@/components/ui/DateInput';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medicalRecords/medicalRecordService';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useAuth } from '@/src/contexts/AuthContext';
import { getDisplayRelation } from '@/src/utils/relation';
import { refreshTracker } from '@/src/utils/refreshTracker';
import { AudioNoteRecorder } from '@/components/medicalRecords/AudioNoteRecorder';
import { MemberChipsSkeleton } from '@/components/ui/Skeleton';



export default function CreateMedicalRecord() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const { user } = useAuth();

  // Form states
  const [members, setMembers] = useState<FamilyMemberOut[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  });
  const [primaryContext, setPrimaryContext] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  
  // Upload states
  const [documents, setDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [audioFiles, setAudioFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);



  // Page states
  const [membersLoading, setMembersLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch family members
  useEffect(() => {
    async function loadMembers() {
      try {
        const family = await familyService.getMyFamily();
        setMembers(family.members);
        
        // Pre-select member if query param matches, otherwise choose the first one
        if (memberId && family.members.some(m => m.id === memberId)) {
          setSelectedMemberId(memberId);
        } else if (family.members.length > 0) {
          setSelectedMemberId(family.members[0].id);
        }
      } catch (err) {
        console.error('Failed to load family members for dropdown', err);
      } finally {
        setMembersLoading(false);
      }
    }
    loadMembers();
  }, [memberId]);

  const formatFileSize = useCallback((bytes?: number): string => {
    if (bytes === undefined || bytes === null) return '0 B';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

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



  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!selectedMemberId) {
      setError('Please select a family member');
      return;
    }
    const dateError = validateDateString(visitDate, { label: 'Visit date' });
    if (dateError) {
      setError(dateError);
      return;
    }

    if (!primaryContext.trim()) {
      setError('Primary context is required (e.g. Cardiology Clinic)');
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        // Create payload object
        const payload = {
          family_member_id: selectedMemberId,
          visit_date: inputDateToApiDate(visitDate),
          primary_context: primaryContext.trim(),
          chief_complaint: chiefComplaint.trim() ? chiefComplaint.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        };

        // Construct multipart form data
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        // Append files
        for (const doc of documents) {
          formData.append('files', {
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || 'application/octet-stream',
          } as any);
        }

        // Append audio files
        for (const audio of audioFiles) {
          formData.append('audio_files', {
            uri: audio.uri,
            name: audio.name,
            type: audio.mimeType || 'application/octet-stream',
          } as any);
        }

        await medicalRecordService.createMedicalRecord(formData);
        refreshTracker.setNeedsRefresh('records', true);
        setSuccess(true);
        
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create medical record';
        setError(message);
      }
    });
  }, [selectedMemberId, visitDate, primaryContext, chiefComplaint, notes, documents, audioFiles, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      enabled={keyboardAvoidingEnabled}
    >
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable 
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Icon 
            name="chevron.left" 
            size={20}
            tintColor={theme.colors.text.primary}
          />
        </Pressable>
        <Typography.Subheading style={styles.headerTitle}>
          Add Medical Record
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {success ? (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Icon 
                name="checkmark.seal.fill" 
                size={40}
                tintColor={theme.colors.status.success}
              />
            </View>
            <Typography.Heading style={styles.successTitle}>
              Record Added!
            </Typography.Heading>
            <Typography.Paragraph style={styles.successDescription}>
              The medical record has been logged successfully. Returning to dashboard...
            </Typography.Paragraph>
          </Animated.View>
        ) : (
          // Form State
          <Animated.View 
            entering={FadeInDown.duration(500)}
            style={styles.formContainer}
          >
            {error ? (
              <View style={styles.errorBanner}>
                <Typography.Label style={styles.errorBannerText}>
                  {error}
                </Typography.Label>
              </View>
            ) : null}

            {/* Member Selector chips */}
            <View style={styles.formGroup}>
              <Typography.Label style={styles.selectLabel}>Select Family Member</Typography.Label>
              {membersLoading ? (
                <MemberChipsSkeleton />
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.membersRow}
                >
                  {members.map((member) => {
                    const isSelected = selectedMemberId === member.id;
                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => setSelectedMemberId(member.id)}
                        style={[
                          styles.memberChip,
                          isSelected ? styles.memberChipSelected : null,
                        ]}
                      >
                        <Typography.Label 
                          style={[
                            styles.memberChipText,
                            isSelected ? styles.memberChipTextSelected : null
                          ]}
                          truncate
                        >
                          {member.name} ({getDisplayRelation(member, user)})
                        </Typography.Label>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* General inputs */}
            <View style={styles.cardForm}>
              <DateInput
                label="Visit Date"
                value={visitDate}
                onChangeText={setVisitDate}
              />

              <TextInput
                label="Primary Context / Location"
                placeholder="e.g. City Dental Clinic, Dr. Watson"
                value={primaryContext}
                onChangeText={setPrimaryContext}
              />

              <TextInput
                label="Chief Complaint"
                placeholder="e.g. Toothache, routine clean"
                value={chiefComplaint}
                onChangeText={setChiefComplaint}
              />

              <TextInput
                label="Notes"
                placeholder="Write medical history details, recommendations, prescriptions..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                style={styles.notesInput}
              />

              {/* Attachments Section */}
              <View style={styles.attachmentsSection}>
                <Typography.Label style={styles.attachmentsLabel}>Attachments</Typography.Label>
                
                {/* Add Documents Button - Full Width */}
                <Pressable
                  onPress={handlePickDocuments}
                  style={({ pressed }) => [
                    styles.fullWidthAttachButton,
                    pressed ? styles.attachButtonPressed : null,
                  ]}
                >
                  <Icon name="doc.fill" size={16} tintColor={theme.colors.primary.DEFAULT} />
                  <Typography.Label style={styles.attachButtonText}>Add Documents</Typography.Label>
                </Pressable>

                {/* Documents List */}
                {documents.length > 0 ? (
                  <View style={styles.fileList}>
                    {documents.map((doc, idx) => (
                      <Animated.View
                        key={`doc-${idx}-${doc.uri}`}
                        entering={FadeInDown.duration(200)}
                        style={styles.fileItem}
                      >
                        <View style={styles.fileInfo}>
                          <Icon name="paperclip" size={16} tintColor={theme.colors.text.secondary} />
                          <View style={styles.fileNameContainer}>
                            <Typography.Paragraph numberOfLines={1} style={styles.fileName}>
                              {doc.name}
                            </Typography.Paragraph>
                            <Typography.Label style={styles.fileSize}>
                              {formatFileSize(doc.size)}
                            </Typography.Label>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => removeDocument(idx)}
                          style={({ pressed }) => [
                            styles.deleteFileButton,
                            pressed ? styles.deleteFileButtonPressed : null,
                          ]}
                        >
                          <Icon name="xmark" size={14} tintColor={theme.colors.text.secondary} />
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                ) : null}

                {/* Audio Note Sub-section */}
                <View style={styles.audioNoteContainer}>
                  <Typography.Label style={styles.audioNoteLabel}>Audio Note</Typography.Label>
                  <AudioNoteRecorder
                    audioFile={audioFiles[0] || null}
                    onAudioChange={(file) => setAudioFiles(file ? [file] : [])}
                  />
                </View>
              </View>

              <Button.Primary
                title="Create Medical Record"
                onPress={handleSubmit}
                loading={isPending}
                style={styles.submitButton}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  formGroup: {
    width: '100%',
  },
  selectLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },

  membersRow: {
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.xl,
    paddingVertical: 2,
  },
  memberChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  memberChipSelected: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  memberChipText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  memberChipTextSelected: {
    color: theme.colors.primary.content,
  },
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  attachmentsSection: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  attachmentsLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  attachmentsButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  attachButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  attachButtonPressed: {
    opacity: 0.6,
  },
  attachButtonText: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '600',
  },
  fileList: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  fileNameContainer: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  deleteFileButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  deleteFileButtonPressed: {
    opacity: 0.6,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
  },
  
  // Success states
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.15)",
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successTitle: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.status.success,
    fontWeight: '700',
  },
  successDescription: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
  },
  fullWidthAttachButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  audioNoteContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  audioNoteLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  recorderPanel: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
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
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
