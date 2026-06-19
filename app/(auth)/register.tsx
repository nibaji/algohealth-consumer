import React, { useCallback, useState, useTransition } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Pressable } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { Link } from 'expo-router';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { useAlert } from '@/src/contexts/AlertContext';

export default function RegisterScreen(): React.JSX.Element {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register } = useAuth();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const { showAlert } = useAlert();

  const toggleShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleRegister = useCallback((): void => {
    if (!email.trim() || !password || !fullName.trim()) {
      showAlert({ title: 'Error', message: 'Please fill in all fields', variant: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert({ title: 'Error', message: 'Please enter a valid email address', variant: 'error' });
      return;
    }

    if (password.length < 6) {
      showAlert({ title: 'Error', message: 'Password must be at least 6 characters long', variant: 'error' });
      return;
    }
    
    startTransition(async () => {
      try {
        await register({ email: email.trim(), password, full_name: fullName.trim() });
        // Navigation is handled by layout route guard
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        showAlert({ title: 'Registration Failed', message, variant: 'error' });
      }
    });
  }, [email, password, fullName, register, showAlert]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior="padding"
      enabled={keyboardAvoidingEnabled}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography.Heading>Create Account</Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Join AlgoHealth Plus today
          </Typography.Paragraph>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordFieldWrapper}>
            <TextInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <Pressable
              onPress={toggleShowPassword}
              style={({ pressed }) => [
                styles.eyeButton,
                pressed ? styles.eyeButtonPressed : null,
              ]}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
            >
              <Icon
                name={showPassword ? IconName.EyeSlash : IconName.Eye}
                size={20}
                tintColor={theme.colors.text.tertiary}
              />
            </Pressable>
          </View>
          
          <Button.Primary 
            title="Register" 
            onPress={handleRegister} 
            loading={isPending}
          />
          
          <View style={styles.footer}>
            <Typography.Label>Already have an account? </Typography.Label>
            <Link href="/(auth)/login" asChild>
              <Button.Secondary 
                title="Sign In" 
                style={styles.linkButton} 
                textStyle={styles.linkText}
              />
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['6xl'],
    justifyContent: 'center',
  },
  header: { marginBottom: theme.spacing['2xl'], gap: theme.spacing.xs },
  subtitle: { color: theme.colors.text.secondary },
  form: { gap: theme.spacing.lg },
  passwordFieldWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: theme.spacing['3xl'],
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
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl },
  linkButton: { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 },
  linkText: { color: theme.colors.primary.DEFAULT },
});

