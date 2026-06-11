import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { FamilyMemberCreate } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

type GenderType = 'Male' | 'Female' | 'Other' | 'Unknown';
type RelationType = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Grandparent' | 'Other';

export default function AddMember() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  // Form states
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>('Spouse');
  const [memberGender, setMemberGender] = useState<GenderType>('Female');
  const [memberDob, setMemberDob] = useState(''); // DD-MM-YYYY
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [customRelation, setCustomRelation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // DOB formatting handler
  const handleDobChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
    }
    setMemberDob(formatted);
  }, []);

  // Form submission handler
  const handleAddMember = useCallback(async () => {
    if (!memberName.trim()) {
      setError('Member name is required');
      return;
    }
    if (!memberDob.trim()) {
      setError('Date of birth is required');
      return;
    }

    // Basic date validation DD-MM-YYYY
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobRegex.test(memberDob)) {
      setError('Date of birth must be in DD-MM-YYYY format');
      return;
    }

    const dateParts = memberDob.split('-');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
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
      setError('Date of birth cannot be in the future');
      return;
    }

    if (memberEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    if (memberMobile.trim()) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(memberMobile.trim())) {
        setError('Please enter a valid mobile number (7 to 15 digits)');
        return;
      }
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const apiDob = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const payload: FamilyMemberCreate = {
        name: memberName,
        relation: memberRelation === 'Other' && customRelation.trim() ? customRelation.trim() : memberRelation,
        gender: memberGender,
        date_of_birth: apiDob,
        email_id: memberEmail.trim() ? memberEmail : null,
        mobile_no: memberMobile.trim() ? memberMobile : null,
      };

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
    } finally {
      setLoading(false);
    }
  }, [memberName, memberRelation, memberGender, memberDob, memberEmail, memberMobile, customRelation, refreshProfile, router]);

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
          <Image 
            source="sf:chevron.left" 
            style={[styles.backIcon, { tintColor: theme.colors.text.primary }]} 
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
            <View style={[styles.successIconCircle, { backgroundColor: '#ECFDF5', borderCurve: 'continuous' }]}>
              <Image 
                source="sf:checkmark.seal.fill" 
                style={[styles.successIcon, { tintColor: theme.colors.status.success }]} 
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
                onChangeText={setMemberName}
                autoFocus
              />

              <View style={styles.formRow}>
                {/* DOB INPUT */}
                <View style={styles.flexHalf}>
                  <TextInput
                    label="Date of Birth"
                    placeholder="DD-MM-YYYY"
                    value={memberDob}
                    onChangeText={handleDobChange}
                    maxLength={10}
                    keyboardType="numeric"
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
                            { borderCurve: 'continuous' }
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
                        onPress={() => setMemberRelation(relationOption)}
                        style={[
                          styles.relationChip,
                          isSelected ? styles.relationChipSelected : null,
                          { borderCurve: 'continuous' }
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
                onChangeText={setMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Mobile Number (Optional)"
                placeholder="e.g. 9876543210"
                value={memberMobile}
                onChangeText={setMemberMobile}
                keyboardType="phone-pad"
              />

              <Button.Primary
                title="Add Member"
                onPress={handleAddMember}
                loading={loading}
                style={styles.addButton}
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
