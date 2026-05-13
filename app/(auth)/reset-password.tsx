import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { authService } from '@/src/services/auth/authService';
import { useRouter } from 'expo-router';

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!token || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await authService.resetPassword({ token, new_password: newPassword });
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography.Heading>New Password</Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Enter the reset token you received and your new password
          </Typography.Paragraph>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Reset Token"
            placeholder="Paste your reset code"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          
          <Button.Primary title="Reset Password" onPress={handleReset} loading={loading} />
          <Button.Secondary title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
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
