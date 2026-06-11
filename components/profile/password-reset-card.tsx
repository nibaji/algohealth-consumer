import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useProfilePasswordReset } from '@/src/features/auth/use-profile-password-reset';

interface PasswordResetCardProps {
  email?: string | null;
}

export const PasswordResetCard = ({ email }: PasswordResetCardProps): React.JSX.Element => {
  const {
    resetToken,
    newPassword,
    confirmPassword,
    resetEmailLoading,
    passwordResetLoading,
    passwordResetError,
    passwordResetSuccess,
    setResetToken,
    setNewPassword,
    setConfirmPassword,
    sendResetEmail,
    resetPassword,
  } = useProfilePasswordReset(email);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleNewPassword = useCallback((): void => {
    setShowNewPassword((prev) => !prev);
  }, []);

  const toggleConfirmPassword = useCallback((): void => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <View style={styles.cardForm}>
      <Typography.Subheading style={styles.formSectionTitle}>
        Password
      </Typography.Subheading>

      <Typography.Paragraph style={styles.passwordHelpText}>
        Send a reset code to {email || 'your email'}, then enter the code and your new password.
      </Typography.Paragraph>

      {passwordResetSuccess ? (
        <View style={styles.successBanner}>
          <Typography.Label selectable style={styles.successBannerText}>
            {passwordResetSuccess}
          </Typography.Label>
        </View>
      ) : null}

      {passwordResetError ? (
        <Typography.Label selectable style={styles.errorBannerText}>
          {passwordResetError}
        </Typography.Label>
      ) : null}

      <Button.Secondary
        title="Send Reset Code"
        onPress={sendResetEmail}
        loading={resetEmailLoading}
      />

      <TextInput
        label="Reset Token"
        placeholder="Paste your reset code"
        value={resetToken}
        onChangeText={setResetToken}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.passwordFieldWrapper}>
        <TextInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          textContentType="newPassword"
          style={styles.passwordInput}
        />
        <Pressable
          onPress={toggleNewPassword}
          style={({ pressed }) => [
            styles.eyeButton,
            pressed ? styles.eyeButtonPressed : null,
          ]}
          hitSlop={8}
          accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
          accessibilityRole="button"
        >
          <Image
            source={showNewPassword ? 'sf:eye.slash' : 'sf:eye'}
            style={[styles.eyeIcon, { tintColor: theme.colors.text.tertiary }]}
          />
        </Pressable>
      </View>

      <View style={styles.passwordFieldWrapper}>
        <TextInput
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          textContentType="newPassword"
          style={styles.passwordInput}
        />
        <Pressable
          onPress={toggleConfirmPassword}
          style={({ pressed }) => [
            styles.eyeButton,
            pressed ? styles.eyeButtonPressed : null,
          ]}
          hitSlop={8}
          accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          accessibilityRole="button"
        >
          <Image
            source={showConfirmPassword ? 'sf:eye.slash' : 'sf:eye'}
            style={[styles.eyeIcon, { tintColor: theme.colors.text.tertiary }]}
          />
        </Pressable>
      </View>

      <Button.Primary
        title="Reset Password"
        onPress={resetPassword}
        loading={passwordResetLoading}
        disabled={resetEmailLoading}
        style={styles.saveButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  formSectionTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  passwordHelpText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
  },
  passwordFieldWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.full,
  },
  eyeButtonPressed: {
    opacity: 0.5,
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  successBanner: {
    backgroundColor: theme.colors.background.default,
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
});

