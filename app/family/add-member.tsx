import React, { useState, useCallback, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput, validateDateString, inputDateToApiDate } from '@/components/ui/DateInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { FamilyMemberCreate } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility';

type GenderType = 'Male' | 'Female' | 'Other' | 'Unknown';
type RelationType = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Grandparent' | 'Other';

export default function AddMember() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisibility();

  let keyboardAvoidingEnabled = isKeyboardVisible;
  if (process.env.EXPO_OS === 'web') {
    keyboardAvoidingEnabled = false;
  } else if (process.env.EXPO_OS === 'ios') {
    keyboardAvoidingEnabled = true;
  }

  // Form states
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>('Spouse');
  const [memberGender, setMemberGender] = useState<GenderType>('Female');
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
      if (value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          errorMsg = 'Please enter a valid email address';
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
  }, []);

  const handleRelationChange = useCallback((relation: RelationType) => {
    setMemberRelation(relation);
  }, []);

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
          relation: memberRelation === 'Other' && customRelation.trim() ? customRelation.trim() : memberRelation,
          gender: memberGender,
          date_of_birth: inputDateToApiDate(memberDob),
          email_id: memberEmail.trim() ? memberEmail : null,
          mobile_no: memberMobile.trim() ? memberMobile : null,
        };

        //### 📋 Add Family Member Form Improvements (Follow-up)
        // - **DOB Formatter & DD-MM-YYYY Validation (`app/family/add-member.tsx`)**: Updated the Date of Birth input field to use the `DD-MM-YYYY` format.
        //   - *On Change segment validation*: DAY digits are verified immediately (must start with 0-3 and resolve to 01-31), MONTH digits are verified immediately (must start with 0-1 and resolve to 01-12), and YEAR is verified to be in the range `[1900, currentYear]` as soon as 4 digits are completed. Also checks the completed date string to verify it is not in the future.
        //   - *On Blur complete verification*: The entire DOB is validated for correct formatting, exact calendar validation (e.g. Feb 30th checks), and checking that the date is not in the future (using timezone-safe date-only comparison).
        //   - *Auto-Hyphenation Formatting*: Hyphens (`-`) are appended immediately upon completing the day (`DD`) and month (`MM`) segments (e.g., typing `12` turns into `12-` immediately) while preserving natural backspace behavior so the user does not get stuck.
        // - **Custom Relationship Option (`app/family/add-member.tsx`)**: Replaced the label "Relation to Owner" with "Relationship". Introduced a conditional "Custom Relationship" text input that appears when the user selects "Other" as the relation, allowing custom labels.
        // - **Form-wide Input Validation on Blur & Change (`app/family/add-member.tsx`)**: Implemented robust inline error displays for Full Name, Email, and Mobile fields. Inputs validate on blur and clear/correct errors immediately on change. Form submission runs a full validate pass over all fields.
        
        await familyService.addFamilyMember(payload);
        
        // Update local profile and context
        await refreshProfile();
        
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
            name="chevron.left" 
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
                name="checkmark.seal.fill" 
                size={40}
                tintColor={theme.colors.status.success}
              />
            </View>
            <Typography.Heading style={styles.successTitle}>
              Member Added!
            </Typography.Heading>
            <Typography.Paragraph style={styles.successDescription}>
              {memberName} has been added to your family health circle successfully.
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
                onChangeText={(text) => {
                  setMemberName(text);
                  if (errors.name) validateField('name', text);
                }}
                onBlur={() => validateField('name', memberName)}
                error={errors.name}
                autoFocus
              />

              <View style={styles.formRow}>
                <View style={styles.flexHalf}>
                  <DateInput
                    label="Date of Birth"
                    value={memberDob}
                    onChangeText={(text) => {
                      setMemberDob(text);
                      if (errors.dob) validateField('dob', text);
                    }}
                    onBlur={() => validateField('dob', memberDob)}
                    error={errors.dob}
                  />
                </View>
                
                {/* GENDER SELECTION CHIPS */}
                <View style={styles.flexHalf}>
                  <Typography.Label style={styles.selectLabel}>Gender</Typography.Label>
                  <View style={styles.chipsRow}>
                    {(['Male', 'Female', 'Other'] as GenderType[]).map((genderOption) => {
                      const isSelected = memberGender === genderOption;
                      return (
                        <Pressable
                          key={genderOption}
                          onPress={() => setMemberGender(genderOption)}
                          style={[
                            styles.chip,
                            isSelected ? styles.chipSelected : null,
                          ]}
                        >
                          <Typography.Label 
                            style={[
                              styles.chipText,
                              isSelected ? styles.chipTextSelected : null
                            ]}
                          >
                            {genderOption}
                          </Typography.Label>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* RELATION SHIPS SELECTION */}
              <View style={styles.formGroup}>
                <Typography.Label style={styles.selectLabel}>Relationship</Typography.Label>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relationsRow}
                >
                  {(['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'] as RelationType[]).map((relationOption) => {
                    const isSelected = memberRelation === relationOption;
                    return (
                      <Pressable
                        key={relationOption}
                        onPress={() => handleRelationChange(relationOption)}
                        style={[
                          styles.relationChip,
                          isSelected ? styles.relationChipSelected : null,
                        ]}
                      >
                        <Typography.Label 
                          style={[
                            styles.relationChipText,
                            isSelected ? styles.relationChipTextSelected : null
                          ]}
                        >
                          {relationOption}
                        </Typography.Label>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Optional Custom Relation TextInput */}
              {memberRelation === 'Other' ? (
                <TextInput
                  label="Custom Relationship (Optional)"
                  placeholder="e.g. Cousin, Friend, Caregiver"
                  value={customRelation}
                  onChangeText={setCustomRelation}
                />
              ) : null}

              <TextInput
                label="Email ID (Optional)"
                placeholder="jane.smith@example.com"
                value={memberEmail}
                onChangeText={(text) => {
                  setMemberEmail(text);
                  if (errors.email) validateField('email', text);
                }}
                onBlur={() => validateField('email', memberEmail)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Mobile Number (Optional)"
                placeholder="e.g. 9876543210"
                value={memberMobile}
                onChangeText={(text) => {
                  setMemberMobile(text);
                  if (errors.mobile) validateField('mobile', text);
                }}
                onBlur={() => validateField('mobile', memberMobile)}
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
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  formRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  selectLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'center',
    height: 48,
  },
  chip: {
    flex: 1,
    height: '100%',
    backgroundColor: theme.colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  chipText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextSelected: {
    color: theme.colors.primary.content,
  },
  formGroup: {
    width: '100%',
    marginVertical: theme.spacing.xs,
  },
  relationsRow: {
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.xl,
  },
  relationChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  relationChipSelected: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  relationChipText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  relationChipTextSelected: {
    color: theme.colors.primary.content,
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
});
