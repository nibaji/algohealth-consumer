import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName });
      // Navigation is handled by layout route guard
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
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
          <Typography.Heading>Create Account</Typography.Heading>
          <Typography.Paragraph style={styles.subtitle}>
            Join AlgoHealth today
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
          <TextInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button.Primary 
            title="Register" 
            onPress={handleRegister} 
            loading={loading}
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
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl },
  linkButton: { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 },
  linkText: { color: theme.colors.primary.DEFAULT },
});
