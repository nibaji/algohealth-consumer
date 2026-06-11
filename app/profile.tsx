import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { authService } from '@/src/services/auth/authService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

export default function Profile() {
  const router = useRouter();
  const { user, refreshProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      await authService.updateMyProfile({
        full_name: fullName.trim(),
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fullName, refreshProfile]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable 
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Image 
            source="sf:chevron.left" 
            style={[styles.backIcon, { tintColor: theme.colors.text.primary }]} 
          />
        </Pressable>
        <Typography.Subheading style={styles.headerTitle}>
          My Profile
        </Typography.Subheading>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          entering={FadeInDown.duration(500)}
          style={styles.profileBody}
        >
          {/* Avatar and name display */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderCurve: 'continuous' }]}>
              <Typography.Heading style={styles.avatarText}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?')}
              </Typography.Heading>
            </View>
            <Typography.Heading style={styles.userName}>
              {user?.full_name || 'AlgoHealth User'}
            </Typography.Heading>
            <Typography.Paragraph style={styles.userEmail}>
              {user?.email}
            </Typography.Paragraph>
          </View>

          {/* Form */}
          <View style={styles.cardForm}>
            <Typography.Subheading style={styles.formSectionTitle}>
              Personal Details
            </Typography.Subheading>

            {success ? (
              <View style={styles.successBanner}>
                <Typography.Label style={styles.successBannerText}>
                  Profile updated successfully!
                </Typography.Label>
              </View>
            ) : null}

            {error ? (
              <Typography.Label style={styles.errorBannerText}>
                {error}
              </Typography.Label>
            ) : null}

            <TextInput
              label="Email Address"
              value={user?.email || ''}
              editable={false}
              selectTextOnFocus={false}
              style={styles.readOnlyInput}
            />

            <TextInput
              label="Full Name"
              placeholder="e.g. John Doe"
              value={fullName}
              onChangeText={setFullName}
            />

            <Button.Primary
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button.Error
              title="Logout / Sign Out"
              onPress={logout}
              style={styles.logoutButton}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
  },
  profileBody: {
    gap: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: "0 10px 15px -3px rgba(138, 43, 226, 0.2)",
  },
  avatarText: {
    color: theme.colors.primary.content,
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
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
  readOnlyInput: {
    backgroundColor: theme.colors.background.default,
    color: theme.colors.text.secondary,
    borderColor: theme.colors.border.light,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
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
  actionsContainer: {
    marginTop: theme.spacing.lg,
  },
  logoutButton: {
    width: '100%',
  },
});
