import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { usePasswordReset } from '@/src/features/auth/use-password-reset';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    email,
    setEmail,
    resetToken,
    setResetToken,
    newPassword,
    setNewPassword,
    resetEmailLoading,
    passwordResetLoading,
    passwordResetError,
    passwordResetSuccess,
    sendResetEmail,
    resetPassword,
  } = usePasswordReset();

  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleResetPassword = useCallback((): void => {
    resetPassword();
  }, [resetPassword]);

  // After a successful reset, provide a button to go back to login
  const handleGoToLogin = useCallback((): void => {
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back button */}
        <View style={styles.topNav}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.backButtonPressed : null,
            ]}
          >
            <Icon name="chevron.left" size={20} tintColor={theme.colors.text.primary} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
          {/* Heading */}
          <View style={styles.header}>
            <Typography.Heading>Forgot Password</Typography.Heading>
            <Typography.Paragraph style={styles.subtitle}>
              Enter your email to receive a reset code, then set your new password below.
            </Typography.Paragraph>
          </View>

          {/* Feedback banners */}
          {passwordResetSuccess ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.successBanner}>
              <Typography.Label selectable style={styles.successText}>
                {passwordResetSuccess}
              </Typography.Label>
            </Animated.View>
          ) : null}

          {passwordResetError ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
              <Typography.Label selectable style={styles.errorText}>
                {passwordResetError}
              </Typography.Label>
            </Animated.View>
          ) : null}

          {/* Step 1 — Send reset code */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Typography.Label style={styles.stepBadgeText}>1</Typography.Label>
              </View>
              <Typography.Subheading style={styles.stepTitle}>Send Reset Code</Typography.Subheading>
            </View>

            <TextInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Button.Secondary
              title="Send Reset Code"
              onPress={sendResetEmail}
              loading={resetEmailLoading}
            />
          </View>

          {/* Step 2 — Enter token and new password */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Typography.Label style={styles.stepBadgeText}>2</Typography.Label>
              </View>
              <Typography.Subheading style={styles.stepTitle}>Set New Password</Typography.Subheading>
            </View>

            <TextInput
              label="Reset Code"
              placeholder="Paste the code from your email"
              value={resetToken}
              onChangeText={setResetToken}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordFieldWrapper}>
              <TextInput
                label="New Password"
                placeholder="Enter your new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                style={styles.passwordInput}
              />
              <Pressable
                onPress={togglePassword}
                style={({ pressed }) => [
                  styles.eyeButton,
                  pressed ? styles.eyeButtonPressed : null,
                ]}
                hitSlop={8}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <Icon
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  tintColor={theme.colors.text.tertiary}
                />
              </Pressable>
            </View>

            {passwordResetSuccess ? (
              <Button.Primary
                title="Back to Login"
                onPress={handleGoToLogin}
                style={styles.ctaButton}
              />
            ) : (
              <Button.Primary
                title="Reset Password"
                onPress={handleResetPassword}
                loading={passwordResetLoading}
                disabled={resetEmailLoading}
                style={styles.ctaButton}
              />
            )}
          </View>

          <Button.Secondary
            title="Back to Login"
            onPress={handleGoToLogin}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  topNav: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  body: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.md,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: theme.colors.status.success,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  successText: {
    color: theme.colors.text.success,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.text.error,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: theme.colors.primary.content,
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
  },
  stepTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
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
  ctaButton: {
    marginTop: theme.spacing.xs,
  },
});
