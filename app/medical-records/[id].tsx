import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';

export default function MedicalRecordDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Page states
  const [record, setRecord] = useState<MedicalRecordResponse | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [memberRelation, setMemberRelation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Edit form states
  const [visitDate, setVisitDate] = useState('');
  const [primaryContext, setPrimaryContext] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load record and member details
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await medicalRecordService.getMedicalRecord(id);
      setRecord(data);

      // Populate edit form states
      setVisitDate(data.visit_date);
      setPrimaryContext(data.primary_context || '');
      setChiefComplaint(data.chief_complaint || '');
      setNotes(data.notes || '');

      // Load family members to resolve the name
      const family = await familyService.getMyFamily();
      const member = family.members.find(m => m.id === data.family_member_id);
      if (member) {
        setMemberName(member.name);
        setMemberRelation(member.relation);
      } else {
        setMemberName('Unknown Member');
        setMemberRelation('Family Circle');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load medical record';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Edit form submission
  const handleSave = useCallback(async () => {
    if (!record) return;
    if (!visitDate.trim()) {
      setEditError('Visit date is required');
      return;
    }

    // Date YYYY-MM-DD validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visitDate)) {
      setEditError('Date must be in YYYY-MM-DD format');
      return;
    }

    const dateParts = visitDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();

    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      setEditError('Please enter a valid calendar date');
      return;
    }

    if (dateObj > today) {
      setEditError('Visit date cannot be in the future');
      return;
    }

    if (!primaryContext.trim()) {
      setEditError('Primary context is required');
      return;
    }

    setEditError(null);
    setEditLoading(true);

    try {
      const updated = await medicalRecordService.updateMedicalRecord(record.id, {
        visit_date: visitDate,
        primary_context: primaryContext.trim(),
        chief_complaint: chiefComplaint.trim() ? chiefComplaint.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });
      setRecord(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update record';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }, [record, visitDate, primaryContext, chiefComplaint, notes]);

  // Deletion logic
  const handleDelete = useCallback(() => {
    if (!record) return;

    const performDelete = async () => {
      setLoading(true);
      try {
        await medicalRecordService.deleteMedicalRecord(record.id);
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
        setVisitDate(record.visit_date);
        setPrimaryContext(record.primary_context || '');
        setChiefComplaint(record.chief_complaint || '');
        setNotes(record.notes || '');
      }
      setEditError(null);
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
      <View style={styles.headerBar}>
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
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : deleteSuccess ? (
          // Success Deleted Screen
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: '#FEE2E2', borderCurve: 'continuous' }]}>
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
            <Button.Secondary title="Retry" onPress={loadData} style={styles.retryButton} />
          </View>
        ) : record ? (
          isEditing ? (
            // EDIT VIEW MODE
            <Animated.View entering={FadeInDown.duration(400)} style={styles.viewContainer}>
              {editError ? (
                <View style={styles.errorBanner}>
                  <Typography.Label style={styles.errorBannerText}>
                    {editError}
                  </Typography.Label>
                </View>
              ) : null}

              <View style={styles.cardForm}>
                <TextInput
                  label="Visit Date"
                  placeholder="YYYY-MM-DD"
                  value={visitDate}
                  onChangeText={setVisitDate}
                  maxLength={10}
                  keyboardType="numeric"
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

                <View style={styles.actionRow}>
                  <Button.Secondary
                    title="Cancel"
                    onPress={handleBack}
                    style={styles.flexHalf}
                  />
                  <Button.Primary
                    title="Save Changes"
                    onPress={handleSave}
                    loading={editLoading}
                    style={styles.flexHalf}
                  />
                </View>
              </View>
            </Animated.View>
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
                  <Typography.Subheading style={styles.memberName}>
                    {memberName}
                  </Typography.Subheading>
                  <Typography.Label style={styles.memberRelation}>
                    {memberRelation}
                  </Typography.Label>
                </View>
              </View>

              {/* Record details */}
              <View style={[styles.detailsCard, { borderCurve: 'continuous' }]}>
                <View style={styles.detailItem}>
                  <Typography.Label style={styles.detailLabel}>Visit Date</Typography.Label>
                  <Typography.Paragraph style={styles.detailValue}>
                    {record.visit_date}
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
    backgroundColor: '#EEF2FF',
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
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
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
  
  // Edit Form Styles
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
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
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
});
