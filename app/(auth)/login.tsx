import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await login({ email, password });
      // Navigation is handled by layout route guard
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Link href="/(auth)/forgot-password" asChild>
            <Button.Secondary 
              title="Forgot Password?" 
              style={styles.forgotPassword} 
              textStyle={styles.forgotPasswordText}
            />
          </Link>
          
          <Button.Primary 
            title="Sign In" 
            onPress={handleLogin} 
            loading={loading}
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
