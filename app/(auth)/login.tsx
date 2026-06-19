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

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { login } = useAuth();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const { showAlert } = useAlert();

  const toggleShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleLogin = useCallback((): void => {
    if (!email.trim() || !password) {
      showAlert({ title: 'Error', message: 'Please fill in all fields', variant: 'danger' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert({ title: 'Error', message: 'Please enter a valid email address', variant: 'danger' });
      return;
    }
    
    startTransition(async () => {
      try {
        await login({ email: email.trim(), password });
        // Navigation is handled by layout route guard
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        showAlert({ title: 'Login Failed', message, variant: 'danger' });
      }
    });
  }, [email, password, login, showAlert]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior="padding"
      enabled={keyboardAvoidingEnabled}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography.Heading>Welcome Back</Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Sign in to continue to your account
          </Typography.Paragraph>
        </View>

        <View style={styles.form}>
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
              placeholder="Enter your password"
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
          
          <Link href="/(auth)/forgotPassword" asChild>
            <Button.Secondary 
              title="Forgot Password?" 
              style={styles.forgotPassword} 
              textStyle={styles.forgotPasswordText}
            />
          </Link>
          
          <Button.Primary 
            title="Sign In" 
            onPress={handleLogin} 
            loading={isPending}
          />
          
          <View style={styles.footer}>
            <Typography.Label>Don&apos;t have an account? </Typography.Label>
            <Link href="/(auth)/register" asChild>
              <Button.Secondary 
                title="Register" 
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['6xl'],
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing['2xl'],
    gap: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.text.secondary,
  },
  form: {
    gap: theme.spacing.lg,
  },
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
  forgotPassword: {
    alignSelf: 'flex-end',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  forgotPasswordText: {
    color: theme.colors.primary.DEFAULT,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  linkButton: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  linkText: {
    color: theme.colors.primary.DEFAULT,
  },
});

