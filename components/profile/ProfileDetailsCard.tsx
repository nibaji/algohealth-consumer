import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { Icon, IconName } from '@/components/ui/Icon';

interface ProfileDetailsCardProps {
  email?: string | null;
  fullName: string;
  loading: boolean;
  error: string | null;
  success: boolean;
  onFullNameChange: (value: string) => void;
  onSave: () => void;
}

export const ProfileDetailsCard = ({
  email,
  fullName,
  loading,
  error,
  success,
  onFullNameChange,
  onSave,
}: ProfileDetailsCardProps): React.JSX.Element => {
  return (
    <View style={styles.cardForm}>
      <Typography.Subheading style={styles.formSectionTitle}>
        Personal Details
      </Typography.Subheading>

      {success ? (
        <View style={styles.successBanner}>
          <Icon
            name={IconName.CheckmarkCircleFill}
            size={16}
            tintColor={theme.colors.text.success}
          />
          <Typography.Label style={styles.successBannerText}>
            Profile updated successfully!
          </Typography.Label>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Icon
            name={IconName.ExclamationmarkCircleFill}
            size={16}
            tintColor={theme.colors.text.error}
          />
          <Typography.Label selectable style={styles.errorBannerText}>
            {error}
          </Typography.Label>
        </View>
      ) : null}

      <TextInput
        label="Email Address"
        value={email || ''}
        editable={false}
        selectTextOnFocus={false}
        style={styles.readOnlyInput}
      />

      <TextInput
        label="Full Name"
        placeholder="e.g. John Doe"
        value={fullName}
        onChangeText={onFullNameChange}
      />

      <Button.Primary
        title="Save Changes"
        onPress={onSave}
        loading={loading}
        style={styles.saveButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  formSectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  readOnlyInput: {
    backgroundColor: theme.colors.background.default,
    color: theme.colors.text.secondary,
    borderColor: theme.colors.border.light,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  successBanner: {
    backgroundColor: theme.colors.background.successLight,
    borderWidth: 1,
    borderColor: theme.colors.status.success,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  successBannerText: {
    color: theme.colors.text.success,
    fontWeight: '600',
    flex: 1,
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
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
    flex: 1,
  },
});
