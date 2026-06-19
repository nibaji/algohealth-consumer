import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme, shadows } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput, validateDateString, inputDateToApiDate } from '@/components/ui/DateInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { refreshTracker } from '@/src/utils/refreshTracker';
import { FamilyOut, FamilyMemberCreate, GenderType, RelationType } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown, FadeInUp, LayoutAnimationConfig } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Icon, IconName } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { GenderSelector } from '@/components/medicalRecords/GenderSelector';
import { RelationSelector } from '@/components/medicalRecords/RelationSelector';

export default function CreateFamily(): React.JSX.Element {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  // Step 1: Create Family states
  const [familyName, setFamilyName] = useState('');
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Created Family details (triggers Step 2 when not null)
  const [createdFamily, setCreatedFamily] = useState<FamilyOut | null>(null);

  // Step 2: Add Member form states
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>(RelationType.Spouse);
  const [memberGender, setMemberGender] = useState<GenderType>(GenderType.Female);
  const [memberDob, setMemberDob] = useState(''); // DD-MM-YYYY
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [customRelation, setCustomRelation] = useState('');

  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState(false);

  // Added members local list
  const [addedMembers, setAddedMembers] = useState<{ name: string; relation: string }[]>([]);

  // Clipboard feedback
  const [copied, setCopied] = useState(false);

  // Create Family submission handler
  const handleCreateFamily = useCallback(async () => {
    if (!familyName.trim()) {
      setFamilyError('Family name is required');
      return;
    }
    setFamilyError(null);
    setFamilyLoading(true);

    try {
      const result = await familyService.createFamily({
        family_name: familyName,
      });
      setCreatedFamily(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create family';
      setFamilyError(message);
    } finally {
      setFamilyLoading(false);
    }
  }, [familyName]);

  // Copy Invite Code handler
  const handleCopyCode = useCallback(async () => {
    if (!createdFamily?.invite_code) return;
    await Clipboard.setStringAsync(createdFamily.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [createdFamily]);

  // Add Family Member submission handler
  const handleAddMember = useCallback(async () => {
    if (!memberName.trim()) {
      setMemberError('Member name is required');
      return;
    }
    const dobError = validateDateString(memberDob, { label: 'Date of birth' });
    if (dobError) {
      setMemberError(dobError);
      return;
    }

    if (memberEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) {
        setMemberError('Please enter a valid email address');
        return;
      }
    }

    if (memberMobile.trim()) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(memberMobile.trim())) {
        setMemberError('Please enter a valid mobile number (7 to 15 digits)');
        return;
      }
    }

    setMemberError(null);
    setMemberLoading(true);
    setMemberSuccess(false);

    try {
      const payload: FamilyMemberCreate = {
        name: memberName,
        relation: memberRelation === RelationType.Other ? customRelation : memberRelation,
        gender: memberGender,
        date_of_birth: inputDateToApiDate(memberDob),
        email_id: memberEmail.trim() ? memberEmail : null,
        mobile_no: memberMobile.trim() ? memberMobile : null,
      };

      await familyService.addFamilyMember(payload);
      
      // Update local list
      setAddedMembers(prev => [...prev, { name: memberName, relation: payload.relation }]);
      
      // Clear member input fields
      setMemberName('');
      setMemberDob('');
      setMemberEmail('');
      setMemberMobile('');
      setCustomRelation('');
      setMemberSuccess(true);
      
      // Auto-hide success banner after 3 seconds
      setTimeout(() => setMemberSuccess(false), 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add member';
      setMemberError(message);
    } finally {
      setMemberLoading(false);
    }
  }, [memberName, memberRelation, memberGender, memberDob, memberEmail, memberMobile, customRelation]);

  // Complete onboarding / Navigate to Home
  const handleFinish = useCallback(async () => {
    await refreshProfile();
    refreshTracker.setNeedsRefresh('family', true);
    refreshTracker.setNeedsRefresh('profile', true);
    refreshTracker.setNeedsRefresh('records', true);
    router.replace('/');
  }, [refreshProfile, router]);

  // Back action helper
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  const handleFamilyNameChange = useCallback((text: string) => {
    setFamilyName(text);
  }, []);

  const handleMemberNameChange = useCallback((text: string) => {
    setMemberName(text);
  }, []);

  const handleMemberDobChange = useCallback((text: string) => {
    setMemberDob(text);
  }, []);

  const handleMemberEmailChange = useCallback((text: string) => {
    setMemberEmail(text);
  }, []);

  const handleMemberMobileChange = useCallback((text: string) => {
    setMemberMobile(text);
  }, []);

  const handleGenderChange = useCallback((gender: GenderType) => {
    setMemberGender(gender);
  }, []);

  const handleRelationChange = useCallback((relation: RelationType) => {
    setMemberRelation(relation);
  }, []);

  const handleCustomRelationChange = useCallback((text: string) => {
    setCustomRelation(text);
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
          {createdFamily ? 'Add Members' : 'Create Family'}
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {createdFamily === null ? (
          // STEP 1: CREATE FAMILY SCREEN
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.stepContainer}
          >
            <View style={styles.infoSection}>
              <Typography.Heading style={styles.stepTitle}>
                Start a New Family
              </Typography.Heading>
              <Typography.Paragraph style={styles.stepDescription}>
                Name your family. As the creator, you&apos;ll be marked as the owner, and you can invite others to view and manage medical records together.
              </Typography.Paragraph>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                label="Family Name"
                placeholder="e.g. The Smiths, Miller Household"
                value={familyName}
                onChangeText={handleFamilyNameChange}
                error={familyError ? familyError : undefined}
                autoFocus
              />

              <Button.Primary
                title="Create & Get Code"
                onPress={handleCreateFamily}
                loading={familyLoading}
                style={styles.submitButton}
              />
            </View>
          </Animated.View>
        ) : (
          // STEP 2: ADD MEMBERS FLOW SCREEN
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.stepContainer}
          >
            {/* STICKY INVITE CODE CONTAINER */}
            <View style={[styles.inviteCodeCard, { borderCurve: 'continuous' }]}>
              <Typography.Label style={styles.inviteLabel}>
                SHARE INVITE CODE
              </Typography.Label>
              <View style={styles.codeRow}>
                <Typography.Heading selectable style={styles.inviteCodeText}>
                  {createdFamily.invite_code}
                </Typography.Heading>
                <Pressable 
                  onPress={handleCopyCode}
                  style={({ pressed }) => [
                    styles.copyButton,
                    pressed ? styles.copyButtonPressed : null,
                    { borderCurve: 'continuous' }
                  ]}
                >
                  <Icon 
                    name={copied ? IconName.Checkmark : IconName.DocOnDocFill} 
                    size={16}
                    tintColor={copied ? theme.colors.status.success : theme.colors.primary.content}
                  />
                  <Typography.Label style={[styles.copyButtonText, copied ? styles.copyTextSuccess : null]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Typography.Label>
                </Pressable>
              </View>
              <Typography.Paragraph style={styles.inviteHelp}>
                Others can enter this code in their &quot;Join Family&quot; screen to join this family instantly.
              </Typography.Paragraph>
            </View>

            {/* ADD MEMBER FORM */}
            <View style={styles.cardForm}>
              <Typography.Subheading style={styles.formSectionTitle}>
                Add a Family Member
              </Typography.Subheading>

              {memberSuccess ? (
                <Animated.View entering={FadeInUp.duration(300)} style={styles.successBanner}>
                  <Typography.Label style={styles.successBannerText}>
                    Member added successfully!
                  </Typography.Label>
                </Animated.View>
              ) : null}

              {memberError ? (
                <Typography.Label style={styles.errorBannerText}>
                  {memberError}
                </Typography.Label>
              ) : null}

              <TextInput
                label="Full Name"
                placeholder="e.g. Jane Smith"
                value={memberName}
                onChangeText={handleMemberNameChange}
              />

              <DateInput
                label="Date of Birth"
                value={memberDob}
                onChangeText={handleMemberDobChange}
              />
              
              {/* GENDER SELECTION CHIPS */}
              <GenderSelector
                gender={memberGender}
                onChangeGender={handleGenderChange}
              />

              {/* RELATION SHIPS SELECTION */}
              <RelationSelector
                isFamilyHead={false}
                relation={memberRelation}
                onChangeRelation={handleRelationChange}
                customRelation={customRelation}
                onChangeCustomRelation={handleCustomRelationChange}
              />

              <TextInput
                label="Email ID (Optional)"
                placeholder="jane.smith@example.com"
                value={memberEmail}
                onChangeText={handleMemberEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Mobile Number (Optional)"
                placeholder="e.g. 9876543210"
                value={memberMobile}
                onChangeText={handleMemberMobileChange}
                keyboardType="phone-pad"
              />

              <Button.Primary
                title="Add"
                onPress={handleAddMember}
                loading={memberLoading}
                style={styles.addButton}
              />
            </View>

            {/* ADDED MEMBERS LIST */}
            {addedMembers.length > 0 ? (
              <LayoutAnimationConfig>
                <Animated.View entering={FadeInDown.duration(400)} style={styles.addedListContainer}>
                  <Typography.Label style={styles.addedListHeader}>
                    ADDED FAMILY MEMBERS ({addedMembers.length})
                  </Typography.Label>
                  <View style={styles.addedList}>
                    {addedMembers.map((member, idx) => (
                      <View key={idx} style={styles.addedMemberCard}>
                        <View style={styles.memberAvatar}>
                          <Typography.Label style={styles.avatarText}>
                            {member.name.charAt(0).toUpperCase()}
                          </Typography.Label>
                        </View>
                        <View style={styles.memberDetails}>
                          <Typography.Paragraph 
                            style={styles.memberNameText}
                            truncate
                          >
                            {member.name}
                          </Typography.Paragraph>
                          <Typography.Label 
                            style={styles.memberRelationText}
                            truncate
                          >
                            {member.relation}
                          </Typography.Label>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </LayoutAnimationConfig>
            ) : null}

            {/* FINAL FINISH BUTTON */}
            <Button.Primary
              title="Done & View Dashboard"
              onPress={handleFinish}
              style={styles.finishButton}
            />
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
    paddingTop: 0,
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
  stepContainer: {
    gap: theme.spacing.lg,
  },
  infoSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  stepTitle: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary.DEFAULT,
  },
  stepDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  formContainer: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    ...shadows.sm,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  inviteCodeCard: {
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.sm,
    ...shadows.primary,
  },
  inviteLabel: {
    color: '#E0C3FC',
    fontWeight: '700',
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  inviteCodeText: {
    color: theme.colors.primary.content,
    fontSize: theme.fontSize['3xl'],
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  copyButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  copyButtonText: {
    color: theme.colors.primary.content,
    fontWeight: '600',
  },
  copyTextSuccess: {
    color: theme.colors.status.success,
  },
  inviteHelp: {
    color: '#F3E8FF',
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
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
  formSectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  addButton: {
    marginTop: theme.spacing.md,
  },
  successBanner: {
    backgroundColor: theme.colors.background.successLight,
    borderWidth: 1,
    borderColor: theme.colors.status.success,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  successBannerText: {
    color: theme.colors.text.success,
    fontWeight: '600',
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
  },
  addedListContainer: {
    gap: theme.spacing.sm,
  },
  addedListHeader: {
    color: theme.colors.text.tertiary,
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
    letterSpacing: 1,
  },
  addedList: {
    gap: theme.spacing.xs,
  },
  addedMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberNameText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  memberRelationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  finishButton: {
    marginTop: theme.spacing.lg,
  },
});
