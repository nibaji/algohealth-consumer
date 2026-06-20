import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, shadows } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput, validateDateString, inputDateToApiDate } from '@/components/ui/DateInput';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medicalRecords/medicalRecordService';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useAuth } from '@/src/contexts/AuthContext';
import { getDisplayRelation } from '@/src/utils/relation';
import { refreshTracker } from '@/src/utils/refreshTracker';
import { uriToBlob } from '@/src/utils/file';
import { AudioNoteRecorder } from '@/components/medicalRecords/AudioNoteRecorder';
import { MemberChipsSkeleton } from '@/components/ui/Skeleton';
import { UserProfileResponse } from '@/src/features/auth/authTypes';

interface MemberChipProps {
  member: FamilyMemberOut;
  isSelected: boolean;
  onPress: (id: string) => void;
  user: UserProfileResponse | null;
}

const MemberChip = React.memo(({ member, isSelected, onPress, user }: MemberChipProps) => {
  const handlePress = useCallback(() => {
    onPress(member.id);
  }, [member.id, onPress]);

  return (
    <Pressable
      onPress={handlePress}
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
});
MemberChip.displayName = 'MemberChip';

interface DocumentListItemProps {
  doc: DocumentPicker.DocumentPickerAsset;
  idx: number;
  onRemove: (idx: number) => void;
  formatFileSize: (bytes?: number) => string;
}

const DocumentListItem = React.memo(({ doc, idx, onRemove, formatFileSize }: DocumentListItemProps) => {
  const handleRemove = useCallback(() => {
    onRemove(idx);
  }, [idx, onRemove]);

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={styles.fileItem}
    >
      <View style={styles.fileInfo}>
        <Icon name={IconName.Paperclip} size={16} tintColor={theme.colors.text.secondary} />
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
        onPress={handleRemove}
        style={({ pressed }) => [
          styles.deleteFileButton,
          pressed ? styles.deleteFileButtonPressed : null,
        ]}
      >
        <Icon name={IconName.Xmark} size={14} tintColor={theme.colors.text.secondary} />
      </Pressable>
    </Animated.View>
  );
});
DocumentListItem.displayName = 'DocumentListItem';

export default function CreateMedicalRecord(): React.JSX.Element {
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
          if (process.env.EXPO_OS === 'web') {
            const blob = await uriToBlob(doc.uri);
            formData.append('files', blob, doc.name);
          } else {
            formData.append('files', {
              uri: doc.uri,
              name: doc.name,
              type: doc.mimeType || 'application/octet-stream',
            } as unknown as Blob);
          }
        }

        // Append audio files
        for (const audio of audioFiles) {
          if (process.env.EXPO_OS === 'web') {
            const blob = await uriToBlob(audio.uri);
            formData.append('audio_files', blob, audio.name);
          } else {
            formData.append('audio_files', {
              uri: audio.uri,
              name: audio.name,
              type: audio.mimeType || 'application/octet-stream',
            } as unknown as Blob);
          }
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

  const handleSelectMember = useCallback((id: string) => {
    setSelectedMemberId(id);
  }, []);

  const handleVisitDateChange = useCallback((text: string) => {
    setVisitDate(text);
  }, []);

  const handlePrimaryContextChange = useCallback((text: string) => {
    setPrimaryContext(text);
  }, []);

  const handleChiefComplaintChange = useCallback((text: string) => {
    setChiefComplaint(text);
  }, []);

  const handleNotesChange = useCallback((text: string) => {
    setNotes(text);
  }, []);

  const handleAudioChange = useCallback((file: DocumentPicker.DocumentPickerAsset | null) => {
    setAudioFiles(file ? [file] : []);
  }, []);

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
            name={IconName.ChevronLeft} 
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
                name={IconName.CheckmarkSealFill} 
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
                <Icon
                  name={IconName.ExclamationmarkCircleFill}
                  size={16}
                  tintColor={theme.colors.text.error}
                />
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
                  {members.map((member) => (
                    <MemberChip
                      key={member.id}
                      member={member}
                      isSelected={selectedMemberId === member.id}
                      onPress={handleSelectMember}
                      user={user}
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* General inputs */}
            <View style={styles.cardForm}>
              <DateInput
                label="Visit Date"
                value={visitDate}
                onChangeText={handleVisitDateChange}
              />

              <TextInput
                label="Primary Context / Location"
                placeholder="e.g. City Dental Clinic, Dr. Watson"
                value={primaryContext}
                onChangeText={handlePrimaryContextChange}
              />

              <TextInput
                label="Chief Complaint"
                placeholder="e.g. Toothache, routine clean"
                value={chiefComplaint}
                onChangeText={handleChiefComplaintChange}
              />

              <TextInput
                label="Notes"
                placeholder="Write medical history details, recommendations, prescriptions..."
                value={notes}
                onChangeText={handleNotesChange}
                multiline
                numberOfLines={4}
                style={styles.notesInput}
              />

              {/* Attachments Section */}
              <View style={styles.attachmentsSection}>
                <Typography.Label style={styles.attachmentsLabel}>Attachments</Typography.Label>
                
                {/* Add Documents Button - Full Width */}
                <Button.Secondary
                  title="Add Documents"
                  onPress={handlePickDocuments}
                  iconName={IconName.DocFill}
                  iconColor={theme.colors.primary.DEFAULT}
                  style={styles.fullWidthAttachButton}
                  textStyle={styles.attachButtonText}
                />

                {/* Documents List */}
                {documents.length > 0 ? (
                  <View style={styles.fileList}>
                    {documents.map((doc, idx) => (
                      <DocumentListItem
                        key={`doc-${idx}-${doc.uri}`}
                        doc={doc}
                        idx={idx}
                        onRemove={removeDocument}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </View>
                ) : null}

                {/* Audio Note Sub-section */}
                <View style={styles.audioNoteContainer}>
                  <Typography.Label style={styles.audioNoteLabel}>Audio Note</Typography.Label>
                  <AudioNoteRecorder
                    audioFile={audioFiles[0] || null}
                    onAudioChange={handleAudioChange}
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
    ...shadows.sm,
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
    ...shadows.sm,
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
    backgroundColor: theme.colors.background.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
  },
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
    backgroundColor: theme.colors.background.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.success,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
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
});
