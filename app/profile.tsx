import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme, shadows } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { PasswordResetCard } from '@/components/profile/PasswordResetCard';
import { ProfileDetailsCard } from '@/components/profile/ProfileDetailsCard';
import { useAuth } from '@/src/contexts/AuthContext';
import { useProfileDetails } from '@/src/features/auth/useProfileDetails';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';

export default function Profile(): React.JSX.Element {
  const router = useRouter();
  const { user, refreshProfile, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();
  const {
    fullName,
    loading,
    error,
    success,
    setFullName,
    saveProfile,
  } = useProfileDetails(user?.full_name, refreshProfile);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      enabled={keyboardAvoidingEnabled}
    >
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable 
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Icon 
            name={IconName.ChevronLeft} 
            size={20}
            tintColor={theme.colors.text.primary}
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
            <Typography.Heading 
              style={styles.userName}
              truncate
            >
              {user?.full_name || 'AlgoHealth User'}
            </Typography.Heading>
            <Typography.Paragraph 
              style={styles.userEmail}
              truncate
            >
              {user?.email}
            </Typography.Paragraph>
          </View>

          <View style={styles.sectionsContainer}>
            <ProfileDetailsCard
              email={user?.email}
              fullName={fullName}
              loading={loading}
              error={error}
              success={success}
              onFullNameChange={setFullName}
              onSave={saveProfile}
            />

            <View style={styles.separator} />

            <PasswordResetCard email={user?.email} />

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
    </KeyboardAvoidingView>
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
  sectionsContainer: {
    backgroundColor: theme.colors.background.surface,
    marginHorizontal: -theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.lg,
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
    ...shadows.primary,
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
  actionsContainer: {
    marginTop: theme.spacing.lg,
  },
  logoutButton: {
    width: '100%',
  },
});
