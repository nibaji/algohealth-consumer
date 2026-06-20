import React, { useState, useEffect, useCallback, useTransition } from 'react';
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
import { FamilyMemberCreate, GenderType, RelationType } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { GenderSelector } from '@/components/medicalRecords/GenderSelector';
import { RelationSelector } from '@/components/medicalRecords/RelationSelector';

export default function AddMember() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  // Form states
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>(RelationType.Spouse);
  const [memberGender, setMemberGender] = useState<GenderType>(GenderType.Female);
  const [memberDob, setMemberDob] = useState(''); // DD-MM-YYYY
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    dob?: string;
    email?: string;
    mobile?: string;
  }>({});

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);

  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const members = await familyService.getFamilyMembers();
        const emails = members
          .map(m => m.email_id)
          .filter((email): email is string => typeof email === 'string' && email.trim() !== '');
        if (user?.email) {
          emails.push(user.email);
        }
        setExistingEmails([...new Set(emails.map(e => e.toLowerCase()))]);
      } catch (err) {
        console.error('Failed to fetch existing family member emails:', err);
      }
    };
    fetchExistingMembers();
  }, [user?.email]);

  // Form field validation handler (runs on blur & submission)
  const validateField = useCallback((field: 'name' | 'dob' | 'email' | 'mobile', value: string) => {
    let errorMsg = '';
    
    if (field === 'name') {
      if (!value.trim()) {
        errorMsg = 'Full name is required';
      }
    } else if (field === 'dob') {
      const dobError = validateDateString(value, { label: 'Date of birth' });
      if (dobError) {
        errorMsg = dobError;
      }
    } else if (field === 'email') {
      const emailTrimmed = value.trim();
      if (!emailTrimmed) {
        errorMsg = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
          errorMsg = 'Please enter a valid email address';
        } else if (existingEmails.includes(emailTrimmed.toLowerCase())) {
          errorMsg = 'This email is already in use by another family member';
        }
      }
    } else if (field === 'mobile') {
      if (value.trim()) {
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(value.trim())) {
          errorMsg = 'Please enter a valid mobile number (7 to 15 digits)';
        }
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: errorMsg ? errorMsg : undefined
    }));

    return !errorMsg;
  }, [existingEmails]);

  const handleRelationChange = useCallback((relation: RelationType) => {
    setMemberRelation(relation);
  }, []);

  const handleNameChange = useCallback((text: string) => {
    setMemberName(text);
    if (errors.name) validateField('name', text);
  }, [errors.name, validateField]);

  const handleDobChange = useCallback((text: string) => {
    setMemberDob(text);
    if (errors.dob) validateField('dob', text);
  }, [errors.dob, validateField]);

  const handleEmailChange = useCallback((text: string) => {
    setMemberEmail(text);
    if (errors.email) validateField('email', text);
  }, [errors.email, validateField]);

  const handleMobileChange = useCallback((text: string) => {
    setMemberMobile(text);
    if (errors.mobile) validateField('mobile', text);
  }, [errors.mobile, validateField]);

  const handleNameBlur = useCallback(() => {
    validateField('name', memberName);
  }, [memberName, validateField]);

  const handleDobBlur = useCallback(() => {
    validateField('dob', memberDob);
  }, [memberDob, validateField]);

  const handleEmailBlur = useCallback(() => {
    validateField('email', memberEmail);
  }, [memberEmail, validateField]);

  const handleMobileBlur = useCallback(() => {
    validateField('mobile', memberMobile);
  }, [memberMobile, validateField]);

  // Form submission handler
  const handleAddMember = useCallback(() => {
    const isNameValid = validateField('name', memberName);
    const isDobValid = validateField('dob', memberDob);
    const isEmailValid = validateField('email', memberEmail);
    const isMobileValid = validateField('mobile', memberMobile);

    if (!isNameValid || !isDobValid || !isEmailValid || !isMobileValid) {
      setError('Please correct the validation errors in the form');
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const payload: FamilyMemberCreate = {
          name: memberName,
          relation: memberRelation === RelationType.Other && customRelation.trim() ? customRelation.trim() : memberRelation,
          gender: memberGender,
          date_of_birth: inputDateToApiDate(memberDob),
          email_id: memberEmail.trim() ? memberEmail : null,
          mobile_no: memberMobile.trim() ? memberMobile : null,
        };
        
        await familyService.addFamilyMember(payload);
        
        // Update local profile and context
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        
        setSuccess(true);
        
        // Navigate back after slight delay for visual feedback
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add member';
        setError(message);
      }
    });
  }, [memberName, memberRelation, memberGender, memberDob, memberEmail, memberMobile, customRelation, refreshProfile, router, validateField]);

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
            name={IconName.ChevronLeft} 
            size={20}
            tintColor={theme.colors.text.primary}
          />
        </Pressable>
        <Typography.Subheading style={styles.headerTitle}>
          Add Family Member
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
          // Success State View
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.successContainer}
          >
            <View style={styles.successIconCircle}>
              <Icon 
                name={IconName.CheckmarkSealFill} 
                size={40}
                tintColor={theme.colors.status.success}
              />
            </View>
            <Typography.Heading style={styles.successTitle}>
              Member Added!
            </Typography.Heading>
            <Typography.Paragraph style={styles.successDescription}>
              {memberName} has been added to your family successfully.
            </Typography.Paragraph>
          </Animated.View>
        ) : (
          <Animated.View 
            entering={FadeInDown.duration(500)} 
            style={styles.formContainer}
          >
            <View style={styles.cardForm}>
              {error ? (
                <Typography.Label style={styles.errorBannerText}>
                  {error}
                </Typography.Label>
              ) : null}

              <TextInput
                label="Full Name"
                placeholder="e.g. Jane Smith"
                value={memberName}
                onChangeText={handleNameChange}
                onBlur={handleNameBlur}
                error={errors.name}
                autoFocus
              />

              <DateInput
                label="Date of Birth"
                value={memberDob}
                onChangeText={handleDobChange}
                onBlur={handleDobBlur}
                error={errors.dob}
              />
              
              {/* GENDER SELECTION CHIPS */}
              <GenderSelector
                gender={memberGender}
                onChangeGender={setMemberGender}
              />

              {/* RELATION SHIPS SELECTION */}
              <RelationSelector
                isFamilyHead={false}
                relation={memberRelation}
                onChangeRelation={handleRelationChange}
                customRelation={customRelation}
                onChangeCustomRelation={setCustomRelation}
              />

              <TextInput
                label="Email ID (Optional)"
                placeholder="jane.smith@example.com"
                value={memberEmail}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Mobile Number (Optional)"
                placeholder="e.g. 9876543210"
                value={memberMobile}
                onChangeText={handleMobileChange}
                onBlur={handleMobileBlur}
                error={errors.mobile}
                keyboardType="phone-pad"
              />

              <Button.Primary
                title="Add Member"
                onPress={handleAddMember}
                loading={isPending}
                style={styles.addButton}
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
    gap: theme.spacing.lg,
  },
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    ...shadows.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  addButton: {
    marginTop: theme.spacing.md,
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
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
