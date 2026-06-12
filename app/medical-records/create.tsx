import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';

export default function CreateMedicalRecord() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();

  // Form states
  const [members, setMembers] = useState<FamilyMemberOut[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [primaryContext, setPrimaryContext] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // Page states
  const [membersLoading, setMembersLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
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

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!selectedMemberId) {
      setError('Please select a family member');
      return;
    }
    if (!visitDate.trim()) {
      setError('Visit date is required');
      return;
    }

    // Date YYYY-MM-DD validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(visitDate)) {
      setError('Date must be in YYYY-MM-DD format');
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
      setError('Please enter a valid calendar date');
      return;
    }

    if (dateObj > today) {
      setError('Visit date cannot be in the future');
      return;
    }

    if (!primaryContext.trim()) {
      setError('Primary context is required (e.g. Cardiology Clinic)');
      return;
    }

    setError(null);
    setSubmitLoading(true);
    setSuccess(false);

    try {
      // Create payload object
      const payload = {
        family_member_id: selectedMemberId,
        visit_date: visitDate,
        primary_context: primaryContext.trim(),
        chief_complaint: chiefComplaint.trim() ? chiefComplaint.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      };

      // Construct multipart form data
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));

      await medicalRecordService.createMedicalRecord(formData);
      setSuccess(true);
      
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create medical record';
      setError(message);
    } finally {
      setSubmitLoading(false);
    }
  }, [selectedMemberId, visitDate, primaryContext, chiefComplaint, notes, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

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
          // Success State
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: '#ECFDF5', borderCurve: 'continuous' }]}>
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
                <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} style={styles.loader} />
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
                          { borderCurve: 'continuous' }
                        ]}
                      >
                        <Typography.Label 
                          style={[
                            styles.memberChipText,
                            isSelected ? styles.memberChipTextSelected : null
                          ]}
                        >
                          {member.name} ({member.relation})
                        </Typography.Label>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* General inputs */}
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

              <Button.Primary
                title="Create Medical Record"
                onPress={handleSubmit}
                loading={submitLoading}
                style={styles.submitButton}
              />
            </View>
          </Animated.View>
        )}
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
  loader: {
    alignSelf: 'flex-start',
    padding: theme.spacing.md,
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
});
