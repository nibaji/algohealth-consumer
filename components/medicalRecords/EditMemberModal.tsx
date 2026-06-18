import React from 'react';
import { 
  View, 
  Modal, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { styles } from './editMemberModalStyles';
import { Icon } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { theme } from '@/constants/theme';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditMemberSkeleton } from '@/components/ui/Skeleton';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useEditMemberForm } from '@/src/features/family/useEditMemberForm';
import { GenderSelector } from './GenderSelector';
import { RelationSelector } from './RelationSelector';

interface EditMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: FamilyMemberOut | null;
  onUpdateSuccess: () => void;
  ownerId: string | null;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = React.memo(({
  visible,
  onClose,
  member,
  onUpdateSuccess,
  ownerId,
}) => {
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  const {
    memberName, setMemberName,
    memberRelation, setMemberRelation,
    memberGender, setMemberGender,
    memberDob, setMemberDob,
    memberEmail, setMemberEmail,
    memberMobile, setMemberMobile,
    customRelation, setCustomRelation,
    isFamilyHead,
    errors,
    loadingDetails,
    saving,
    deleting,
    error,
    canDelete,
    validateField,
    handleUpdateMember,
    handleDeleteMember,
  } = useEditMemberForm({
    visible,
    member,
    ownerId,
    onClose,
    onUpdateSuccess,
  });

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
            <View style={{ padding: theme.spacing.lg }}>
              <EditMemberSkeleton />
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
                  
                  <GenderSelector
                    gender={memberGender}
                    onChangeGender={setMemberGender}
                  />

                  <RelationSelector
                    isFamilyHead={isFamilyHead}
                    relation={memberRelation}
                    onChangeRelation={setMemberRelation}
                    customRelation={customRelation}
                    onChangeCustomRelation={setCustomRelation}
                  />

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

                    {canDelete ? (
                      <Button.Secondary
                        title="Delete Family Member"
                        onPress={handleDeleteMember}
                        loading={deleting}
                        disabled={saving}
                        textStyle={{ color: theme.colors.status.error }}
                        style={styles.deleteButton}
                      />
                    ) : null}
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
