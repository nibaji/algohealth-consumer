import React, { useCallback, useState, useTransition } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Alert, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { Link } from 'expo-router';
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility';

export default function RegisterScreen(): React.JSX.Element {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register } = useAuth();
  const isKeyboardVisible = useKeyboardVisibility();

  let keyboardAvoidingEnabled = isKeyboardVisible;
  if (process.env.EXPO_OS === 'web') {
    keyboardAvoidingEnabled = false;
  } else if (process.env.EXPO_OS === 'ios') {
    keyboardAvoidingEnabled = true;
  }

  const toggleShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleRegister = (): void => {
    if (!email.trim() || !password || !fullName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    startTransition(async () => {
      try {
        await register({ email: email.trim(), password, full_name: fullName.trim() });
        // Navigation is handled by layout route guard
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        Alert.alert('Registration Failed', message);
      }
    });
  };

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
                name={showPassword ? 'eye.slash' : 'eye'}
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
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl },
  linkButton: { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 },
  linkText: { color: theme.colors.primary.DEFAULT },
});

