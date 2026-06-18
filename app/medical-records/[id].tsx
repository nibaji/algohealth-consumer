import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { validateDateString, apiDateToInputDate, inputDateToApiDate } from '@/components/ui/DateInput';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/contexts/AuthContext';
import { getDisplayRelation } from '@/src/utils/relation';
import { refreshTracker } from '@/src/utils/refreshTracker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { fileService } from '@/src/services/medical-records/fileService';
import { AudioPlayerView } from '@/components/medical-records/audio-player-view';
import { EditRecordForm } from '@/components/medical-records/edit-record-form';
import { formatFileSize } from '@/src/utils/file';
import { ENV } from '@/src/utils/config/env';

export default function MedicalRecordDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Page states
  const [record, setRecord] = useState<MedicalRecordResponse | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [memberRelation, setMemberRelation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Audio Note & Document state
  const [localAudioUri, setLocalAudioUri] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const player = useAudioPlayer(localAudioUri);
  const playerStatus = useAudioPlayerStatus(player);



  const handleDownloadFile = useCallback(async (fileId: string, blobName: string, bucket: string, filename: string, mimeType: string) => {
    if (process.env.EXPO_OS === 'web') {
      try {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${ENV.API_BASE_URL}/utils/get-file`;
        form.target = '_blank';

        const inputBlobName = document.createElement('input');
        inputBlobName.type = 'hidden';
        inputBlobName.name = 'blob_name';
        inputBlobName.value = blobName;
        form.appendChild(inputBlobName);

        const inputBucket = document.createElement('input');
        inputBucket.type = 'hidden';
        inputBucket.name = 'bucket';
        inputBucket.value = bucket;
        form.appendChild(inputBucket);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } catch (err) {
        console.error('Failed to submit form for download', err);
        Alert.alert('Error', 'Failed to download file');
      }
    } else {
      setDownloadingFileId(fileId);
      try {
        const localUri = await fileService.getLocalFileUri(blobName, bucket, filename);
        if (process.env.EXPO_OS === 'android') {
          try {
            const contentUri = await FileSystem.getContentUriAsync(localUri);
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1, // Grant read URI permission
              type: mimeType || 'application/octet-stream',
            });
          } catch (intentErr) {
            console.error('Failed to open via intent launcher, falling back to Sharing', intentErr);
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(localUri);
            } else {
              Alert.alert('Error', 'No application found to open this file.');
            }
          }
        } else {
          // iOS
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri);
          } else {
            Alert.alert('Error', 'Sharing/Viewing is not available on this device');
          }
        }
      } catch (err) {
        console.error('Failed to download file natively', err);
        Alert.alert('Error', 'Failed to download file');
      } finally {
        setDownloadingFileId(null);
      }
    }
  }, []);

  const handlePlayPauseAudio = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      if (playerStatus.duration > 0 && playerStatus.currentTime >= playerStatus.duration - 0.1) {
        player.seekTo(0);
      }
      player.play();
    }
  }, [player, playerStatus.playing, playerStatus.duration, playerStatus.currentTime]);

  const handleSeekAudio = useCallback((percentage: number) => {
    if (playerStatus.duration > 0) {
      player.seekTo(percentage * playerStatus.duration);
    }
  }, [player, playerStatus.duration]);

  // Load local audio URI when audio is available in the record
  useEffect(() => {
    const downloadAudio = async () => {
      const audioItem = record?.audio?.[0];
      if (audioItem && !localAudioUri) {
        setLoadingAudio(true);
        try {
          const uri = await fileService.getLocalFileUri(
            audioItem.blob_name || '',
            audioItem.bucket || '',
            audioItem.filename
          );
          setLocalAudioUri(uri);
        } catch (err) {
          console.error('Failed to download audio file', err);
        } finally {
          setLoadingAudio(false);
        }
      }
    };
    downloadAudio();
  }, [record, localAudioUri]);

  // Pause audio on unmount or when navigating away
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  // Sync player source when local uri changes
  useEffect(() => {
    if (localAudioUri) {
      try {
        player.replace(localAudioUri);
      } catch {}
    }
  }, [localAudioUri, player]);

  // Edit form states
  const [visitDate, setVisitDate] = useState('');
  const [primaryContext, setPrimaryContext] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [editError, setEditError] = useState<string | null>(null);

  // New attachments state (edit mode only — these are staged before save)
  const [newDocuments, setNewDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [newAudioFile, setNewAudioFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Load record and member details
  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    if (!id) return;
    try {
      const data = await medicalRecordService.getMedicalRecord(id);
      const family = await familyService.getMyFamily();
      
      if (isCancelled?.()) return;

      setRecord(data);
      setVisitDate(apiDateToInputDate(data.visit_date));
      setPrimaryContext(data.primary_context || '');
      setChiefComplaint(data.chief_complaint || '');
      setNotes(data.notes || '');

      const member = family.members.find(m => m.id === data.family_member_id);
      if (member) {
        setMemberName(member.name);
        setMemberRelation(getDisplayRelation(member, user));
      } else {
        setMemberName('Unknown Member');
        setMemberRelation('Family');
      }
    } catch (err: unknown) {
      if (isCancelled?.()) return;
      const message = err instanceof Error ? err.message : 'Failed to load medical record';
      setError(message);
    } finally {
      if (isCancelled?.()) return;
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await loadData(() => ignore);
    };
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Pick additional documents in edit mode
  const handlePickNewDocuments = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        setNewDocuments(prev => {
          const existingKeys = new Set(prev.map(d => `${d.name}-${d.size}`));
          const unique: DocumentPicker.DocumentPickerAsset[] = [];
          for (const asset of result.assets) {
            const key = `${asset.name}-${asset.size}`;
            if (!existingKeys.has(key)) {
              unique.push(asset);
              existingKeys.add(key);
            }
          }
          return [...prev, ...unique];
        });
      }
    } catch (err) {
      console.error('Failed to pick documents', err);
    }
  }, []);

  const removeNewDocument = useCallback((idx: number) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Edit form submission
  const handleSave = useCallback(async () => {
    if (!record) return;
    const dateError = validateDateString(visitDate, { label: 'Visit date' });
    if (dateError) {
      setEditError(dateError);
      return;
    }

    if (!primaryContext.trim()) {
      setEditError('Primary context is required');
      return;
    }

    setEditError(null);

    startTransition(async () => {
      try {
        // 1. Upload any new attachments first
        if (newDocuments.length > 0 || newAudioFile !== null) {
          await medicalRecordService.addAttachmentsToRecord(
            record.id,
            record.family_member_id,
            newDocuments.map(d => ({ uri: d.uri, name: d.name, mimeType: d.mimeType, size: d.size })),
            newAudioFile
              ? [{ uri: newAudioFile.uri, name: newAudioFile.name, mimeType: newAudioFile.mimeType, size: newAudioFile.size }]
              : []
          );
        }

        // 2. Patch the text fields
        const updated = await medicalRecordService.updateMedicalRecord(record.id, {
          visit_date: inputDateToApiDate(visitDate),
          primary_context: primaryContext.trim(),
          chief_complaint: chiefComplaint.trim() ? chiefComplaint.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        });

        refreshTracker.setNeedsRefresh('records', true);
        setRecord(updated);
        setNewDocuments([]);
        setNewAudioFile(null);
        setIsEditing(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update record';
        setEditError(message);
      }
    });
  }, [record, visitDate, primaryContext, chiefComplaint, notes, newDocuments, newAudioFile]);

  // Deletion logic
  const handleDelete = useCallback(() => {
    if (!record) return;

    const performDelete = async () => {
      setLoading(true);
      try {
        await medicalRecordService.deleteMedicalRecord(record.id);
        refreshTracker.setNeedsRefresh('records', true);
        setDeleteSuccess(true);
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete record';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Error', message);
        }
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this medical record? This action is permanent and cannot be undone.'
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Record',
        'Are you sure you want to delete this medical record? This action is permanent and cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: performDelete
          }
        ]
      );
    }
  }, [record, router]);

  const handleBack = useCallback(() => {
    if (isEditing) {
      // Revert edit states to current record values
      if (record) {
        setVisitDate(apiDateToInputDate(record.visit_date));
        setPrimaryContext(record.primary_context || '');
        setChiefComplaint(record.chief_complaint || '');
        setNotes(record.notes || '');
      }
      setEditError(null);
      setNewDocuments([]);
      setNewAudioFile(null);
      setIsEditing(false);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [isEditing, record, router]);

  return (
    <View style={styles.container}>
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
          {isEditing ? 'Edit Record' : 'Record Details'}
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.DEFAULT]}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : deleteSuccess ? (
          // Success Deleted Screen
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: theme.colors.background.errorLight, borderCurve: 'continuous' }]}>
              <Icon 
                name="trash.fill" 
                size={40}
                tintColor={theme.colors.status.error}
              />
            </View>
            <Typography.Heading style={[styles.successTitle, { color: theme.colors.status.error }]}>
              Record Deleted
            </Typography.Heading>
            <Typography.Paragraph style={styles.successDescription}>
              The medical record has been deleted successfully. Returning to dashboard...
            </Typography.Paragraph>
          </Animated.View>
        ) : error ? (
          // Error State
          <View style={styles.errorContainer}>
            <Typography.Paragraph style={styles.errorText}>
              {error}
            </Typography.Paragraph>
            <Button.Secondary title="Retry" onPress={handleRetry} style={styles.retryButton} />
          </View>
        ) : record ? (
          isEditing ? (
            <EditRecordForm
              visitDate={visitDate}
              setVisitDate={setVisitDate}
              primaryContext={primaryContext}
              setPrimaryContext={setPrimaryContext}
              chiefComplaint={chiefComplaint}
              setChiefComplaint={setChiefComplaint}
              notes={notes}
              setNotes={setNotes}
              editError={editError}
              newDocuments={newDocuments}
              handlePickNewDocuments={handlePickNewDocuments}
              removeNewDocument={removeNewDocument}
              newAudioFile={newAudioFile}
              setNewAudioFile={setNewAudioFile}
              handleBack={handleBack}
              handleSave={handleSave}
              isPending={isPending}
            />
          ) : (
            // DETAIL VIEW MODE
            <Animated.View entering={FadeInDown.duration(400)} style={styles.viewContainer}>
              
              {/* Member Card Summary */}
              <View style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Typography.Label style={styles.avatarText}>
                    {memberName.charAt(0).toUpperCase()}
                  </Typography.Label>
                </View>
                <View style={styles.memberInfo}>
                  <Typography.Subheading 
                    style={styles.memberName}
                    truncate
                  >
                    {memberName}
                  </Typography.Subheading>
                  <Typography.Label 
                    style={styles.memberRelation}
                    truncate
                  >
                    {memberRelation}
                  </Typography.Label>
                </View>
              </View>

              {/* Record details */}
              <View style={[styles.detailsCard, { borderCurve: 'continuous' }]}>
                <View style={styles.detailItem}>
                  <Typography.Label style={styles.detailLabel}>Visit Date</Typography.Label>
                  <Typography.Paragraph style={styles.detailValue}>
                    {apiDateToInputDate(record.visit_date)}
                  </Typography.Paragraph>
                </View>

                <View style={styles.detailItem}>
                  <Typography.Label style={styles.detailLabel}>Context / Location</Typography.Label>
                  <Typography.Paragraph style={styles.detailValue}>
                    {record.primary_context || 'Not Specified'}
                  </Typography.Paragraph>
                </View>

                <View style={styles.detailItem}>
                  <Typography.Label style={styles.detailLabel}>Chief Complaint</Typography.Label>
                  <Typography.Paragraph style={[styles.detailValue, { fontWeight: '600' }]}>
                    {record.chief_complaint || 'No Complaint'}
                  </Typography.Paragraph>
                </View>

                <View style={styles.detailItem}>
                  <Typography.Label style={styles.detailLabel}>Clinical Notes</Typography.Label>
                  <Typography.Paragraph style={styles.notesValue}>
                    {record.notes || 'No notes available.'}
                  </Typography.Paragraph>
                </View>
              </View>

              {/* Audio Note Player */}
              {(record.audio || []).length > 0 ? (
                <View style={[styles.audioCard, { borderCurve: 'continuous' }]}>
                  <Typography.Label style={styles.sectionLabel}>Audio Note</Typography.Label>
                  {loadingAudio ? (
                    <View style={styles.audioLoader}>
                      <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
                      <Typography.Label style={styles.loadingAudioText}>Loading audio...</Typography.Label>
                    </View>
                  ) : localAudioUri ? (
                    <AudioPlayerView
                      isPlaying={playerStatus.playing}
                      currentTime={playerStatus.currentTime}
                      duration={playerStatus.duration}
                      onPlayPause={handlePlayPauseAudio}
                      onSeek={handleSeekAudio}
                    />
                  ) : (
                    <Typography.Label style={styles.errorText}>Failed to load audio</Typography.Label>
                  )}
                </View>
              ) : null}

              {/* Attachments Section */}
              {(record.files || []).length > 0 ? (
                <View style={[styles.filesCard, { borderCurve: 'continuous' }]}>
                  <Typography.Label style={styles.sectionLabel}>Attachments</Typography.Label>
                  <View style={styles.filesGrid}>
                    {record.files?.map((file) => {
                      const isDownloading = downloadingFileId === file.id;
                      return (
                        <Pressable
                          key={file.id}
                          disabled={isDownloading}
                          onPress={() => handleDownloadFile(file.id, file.blob_name || '', file.bucket || '', file.filename, file.mime_type || '')}
                          style={({ pressed }) => [
                            styles.fileChip,
                            pressed ? styles.fileChipPressed : null,
                            { borderCurve: 'continuous' }
                          ]}
                        >
                          <Icon name="doc.fill" size={16} tintColor={theme.colors.primary.DEFAULT} />
                          <View style={styles.fileChipInfo}>
                            <Typography.Paragraph numberOfLines={1} style={styles.fileChipName}>
                              {file.filename}
                            </Typography.Paragraph>
                            <Typography.Label style={styles.fileChipSize}>
                              {formatFileSize(file.size || 0)}
                            </Typography.Label>
                          </View>
                          {isDownloading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* AI Summary Section */}
              {record.ai_summary ? (
                <View style={[styles.aiSummaryCard, { borderCurve: 'continuous' }]}>
                  <View style={styles.aiHeader}>
                    <Icon name="sparkles" size={16} tintColor={theme.colors.primary.DEFAULT} />
                    <Typography.Label style={styles.aiTitle}>
                      AI Clinical Summary
                    </Typography.Label>
                  </View>
                  <Typography.Paragraph style={styles.aiText}>
                    {record.ai_summary}
                  </Typography.Paragraph>
                </View>
              ) : null}

              {/* Action buttons */}
              <View style={styles.recordActions}>
                <Button.Secondary
                  title="Edit Record"
                  onPress={() => setIsEditing(true)}
                  style={styles.actionBtn}
                />
                <Button.Error
                  title="Delete Record"
                  onPress={handleDelete}
                  style={styles.actionBtn}
                />
              </View>
            </Animated.View>
          )
        ) : null}
      </ScrollView>
    </View>
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
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  loaderContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  viewContainer: {
    gap: theme.spacing.lg,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  memberRelation: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  detailsCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  detailItem: {
    gap: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  notesValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeight.md,
  },
  
  // AI summary style
  aiSummaryCard: {
    backgroundColor: theme.colors.background.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    boxShadow: "0 4px 6px -1px rgba(138, 43, 226, 0.05)",
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sparkleIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary.DEFAULT,
  },
  aiTitle: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiText: {
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeight.md,
    fontSize: theme.fontSize.sm,
  },
  recordActions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    width: '100%',

  },
  
  // Success state
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
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.15)",
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
  },
  successDescription: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
  },
  audioCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.sm,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  audioLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  loadingAudioText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  filesCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  filesGrid: {
    gap: theme.spacing.sm,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  fileChipPressed: {
    backgroundColor: theme.colors.border.light,
  },
  fileChipInfo: {
    flex: 1,
    gap: 2,
  },
  fileChipName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  fileChipSize: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
});
