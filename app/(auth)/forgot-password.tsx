import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { authService } from '@/src/services/auth/authService';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      Alert.alert('Success', 'If an account exists, a reset link has been sent.', [
        { text: 'OK', onPress: () => router.push('/(auth)/reset-password') }
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography.Heading>Reset Password</Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Enter your email to receive a reset code
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
          
          <Button.Primary title="Send Reset Link" onPress={handleForgot} loading={loading} />
          <Button.Secondary title="Back to Login" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1, padding: theme.spacing.xl, paddingTop: theme.spacing['6xl'], justifyContent: 'center',
  },
  header: { marginBottom: theme.spacing['2xl'], gap: theme.spacing.xs },
  subtitle: { color: theme.colors.text.secondary },
  form: { gap: theme.spacing.lg },
});
