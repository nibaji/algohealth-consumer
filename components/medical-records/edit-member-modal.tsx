import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput, validateDateString, apiDateToInputDate, inputDateToApiDate } from '@/components/ui/DateInput';
import { theme } from '@/constants/theme';
import { FamilyMemberOut, FamilyMemberUpdate } from '@/src/features/family/familyTypes';
import { familyService } from '@/src/services/family/familyService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';

interface EditMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: FamilyMemberOut | null;
  onUpdateSuccess: () => void;
}

type GenderType = 'Male' | 'Female' | 'Other' | 'Unknown';
type RelationType = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Grandparent' | 'Other';

export const EditMemberModal: React.FC<EditMemberModalProps> = React.memo(({
  visible,
  onClose,
  member,
  onUpdateSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  // Loading and error states
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>('Spouse');
  const [memberGender, setMemberGender] = useState<GenderType>('Female');
  const [memberDob, setMemberDob] = useState(''); // DD-MM-YYYY
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [isFamilyHead, setIsFamilyHead] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    dob?: string;
    email?: string;
    mobile?: string;
  }>({});



  // Fetch full details of the member when modal opens
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!visible || !member) return;
      
      setError(null);
      setLoadingDetails(true);
      setErrors({});
      setCustomRelation('');

      setIsFamilyHead((member?.relation || '').toLowerCase() === 'self');

      try {
        const fullDetails = await familyService.getFamilyMember(member.id);
        setMemberName(fullDetails.name);
        
        setIsFamilyHead((fullDetails.relation || '').toLowerCase() === 'self');

        // Match relation option
        const relationVal = fullDetails.relation;
        const standardRelations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent'];
        if (standardRelations.includes(relationVal)) {
          setMemberRelation(relationVal as RelationType);
          setCustomRelation('');
        } else {
          setMemberRelation('Other');
          setCustomRelation(relationVal);
        }

        setMemberGender((fullDetails.gender || 'Unknown') as GenderType);
        setMemberDob(apiDateToInputDate(fullDetails.date_of_birth));
        setMemberEmail(fullDetails.email_id || '');
        setMemberMobile(fullDetails.mobile_no || '');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load member details';
        setError(msg);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchMemberDetails();
  }, [visible, member]);

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

  // Form submission handler for saving edits
  const handleUpdateMember = useCallback(async () => {
    if (!member) return;

    const isNameValid = validateField('name', memberName);
    const isDobValid = validateField('dob', memberDob);
    const isEmailValid = validateField('email', memberEmail);
    const isMobileValid = validateField('mobile', memberMobile);

    if (!isNameValid || !isDobValid || !isEmailValid || !isMobileValid) {
      setError('Please correct the validation errors in the form');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload: FamilyMemberUpdate = {
        name: memberName,
        relation: isFamilyHead ? (member?.relation || 'Self') : (memberRelation === 'Other' && customRelation.trim() ? customRelation.trim() : memberRelation),
        gender: memberGender,
        date_of_birth: inputDateToApiDate(memberDob),
        email_id: memberEmail.trim() ? memberEmail : null,
        mobile_no: memberMobile.trim() ? memberMobile : null,
      };

      await familyService.updateFamilyMember(member.id, payload);
      onUpdateSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update member';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [member, memberName, memberRelation, memberGender, memberDob, memberEmail, memberMobile, customRelation, isFamilyHead, onUpdateSuccess, onClose, validateField]);

  // Handler for deleting member
  const handleDeleteMember = useCallback(() => {
    if (!member) return;

    const performDelete = async () => {
      setError(null);
      setDeleting(true);
      try {
        await familyService.deleteFamilyMember(member.id);
        onUpdateSuccess();
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete member';
        setError(msg);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${member.name}? All of their medical records will be deleted permanently. This action cannot be undone.`
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Family Member',
        `Are you sure you want to delete ${member.name}? All of their medical records will be deleted permanently. This action cannot be undone.`,
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
  }, [member, onUpdateSuccess, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header bar */}
        <View style={[styles.headerBar, Platform.OS !== 'ios' ? { paddingTop: insets.top, height: 56 + insets.top } : null]}>
          <Pressable 
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Icon 
              name="xmark" 
              size={20}
              tintColor={theme.colors.text.primary}
            />
          </Pressable>
          <Typography.Subheading style={styles.headerTitle}>
            Edit Family Member
          </Typography.Subheading>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView 
          behavior="padding"
          enabled={keyboardAvoidingEnabled}
          style={styles.keyboardView}
        >
          {loadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
              <Typography.Paragraph style={styles.loadingText}>
                Loading details...
              </Typography.Paragraph>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View 
                entering={FadeInDown.duration(400)} 
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
                  />

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
                  
                  {/* GENDER SELECTION CHIPS */}
                  <View style={styles.formGroup}>
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
                              truncate
                            >
                              {genderOption}
                            </Typography.Label>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* RELATION SHIPS SELECTION */}
                  <View style={styles.formGroup}>
                    <Typography.Label style={styles.selectLabel}>Relationship to Family Head</Typography.Label>
                    {isFamilyHead ? (
                      <View style={[styles.lockedRelationContainer, { borderCurve: 'continuous' }]}>
                        <Typography.Paragraph style={styles.lockedRelationText}>
                          Self (Family Head)
                        </Typography.Paragraph>
                      </View>
                    ) : (
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
                    )}
                  </View>

                  {/* Optional Custom Relation TextInput */}
                  {!isFamilyHead && memberRelation === 'Other' ? (
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

                  {/* Button Actions */}
                  <View style={styles.actionsContainer}>
                    <Button.Primary
                      title="Save Changes"
                      onPress={handleUpdateMember}
                      loading={saving}
                      disabled={deleting}
                      style={styles.saveButton}
                    />

                    <Button.Secondary
                      title="Delete Family Member"
                      onPress={handleDeleteMember}
                      loading={deleting}
                      disabled={saving}
                      textStyle={{ color: theme.colors.status.error }}
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

EditMemberModal.displayName = 'EditMemberModal';

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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  closeIcon: {
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['8xl'],
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
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
  lockedRelationContainer: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  lockedRelationText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  saveButton: {
    width: '100%',
  },
  deleteButton: {
    width: '100%',
    borderColor: theme.colors.status.error,
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
  },
});
