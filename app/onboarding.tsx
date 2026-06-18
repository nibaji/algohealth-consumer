import React, { useState, useEffect, useTransition } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { InvitesSkeleton } from '@/components/ui/Skeleton';
import { familyService } from '@/src/services/family/familyService';
import { FamilyOut } from '@/src/features/family/familyTypes';
import { refreshTracker } from '@/src/utils/refreshTracker';

export default function Onboarding() {
  const router = useRouter();
  const { logout, user, isFamilyPending, setHasSkippedOnboarding, refreshProfile } = useAuth();
  const [pendingFamily, setPendingFamily] = useState<FamilyOut | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  const [isActionPending, startActionTransition] = useTransition();

  useEffect(() => {
    if (!isFamilyPending) {
      const timer = setTimeout(() => {
        setPendingFamily(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchPendingFamily = async () => {
      setLoadingInvite(true);
      setInviteError(null);
      try {
        const familyData = await familyService.getMyFamily();
        setPendingFamily(familyData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load pending invite';
        setInviteError(msg);
      } finally {
        setLoadingInvite(false);
      }
    };
    fetchPendingFamily();
  }, [isFamilyPending]);

  const handleJoinPress = React.useCallback(() => {
    router.push('/family/join');
  }, [router]);

  const handleCreatePress = React.useCallback(() => {
    router.push('/family/create');
  }, [router]);

  const handleSkipOnboarding = React.useCallback(() => {
    setHasSkippedOnboarding(true);
    router.replace('/');
  }, [setHasSkippedOnboarding, router]);

  const handleAcceptInvite = React.useCallback(() => {
    if (!pendingFamily) return;
    setInviteError(null);
    startActionTransition(async () => {
      try {
        await familyService.joinFamily({
          family_id: pendingFamily.id,
        });
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        refreshTracker.setNeedsRefresh('profile', true);
        refreshTracker.setNeedsRefresh('records', true);
        router.replace('/');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to accept invitation';
        setInviteError(msg);
      }
    });
  }, [pendingFamily, refreshProfile, router]);

  const handleRejectInvite = React.useCallback(() => {
    if (!pendingFamily) return;
    setInviteError(null);
    startActionTransition(async () => {
      try {
        await familyService.rejectFamily({
          family_id: pendingFamily.id,
        });
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        refreshTracker.setNeedsRefresh('profile', true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reject invitation';
        setInviteError(msg);
      }
    });
  }, [pendingFamily, refreshProfile]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {isFamilyPending ? (
          <View style={styles.inviteContainer}>
            <Animated.View 
              entering={FadeInDown.duration(600).springify()} 
              style={styles.header}
            >
              <Typography.Heading style={styles.title}>
                Family Invitation
              </Typography.Heading>
              <Typography.Paragraph style={styles.subtitle}>
                You have a pending invitation to join a family circle.
              </Typography.Paragraph>
            </Animated.View>

            {loadingInvite ? (
              <InvitesSkeleton />
            ) : pendingFamily ? (
              <Animated.View 
                entering={FadeInDown.duration(600).delay(200).springify()}
                style={[styles.inviteCard, { borderCurve: 'continuous' }]}
              >
                <View style={styles.inviteCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="envelope.fill" size={24} tintColor={theme.colors.primary.DEFAULT} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Typography.Subheading style={styles.cardTitle} truncate>
                      {pendingFamily.name}
                    </Typography.Subheading>
                    <Typography.Paragraph style={styles.cardDescription}>
                      You will gain access to shared medical records and files upon joining.
                    </Typography.Paragraph>
                  </View>
                </View>

                {inviteError ? (
                  <Typography.Label style={styles.errorText}>
                    {inviteError}
                  </Typography.Label>
                ) : null}

                <View style={styles.inviteButtonsContainer}>
                  <Button.Primary 
                    title="Accept Invitation" 
                    onPress={handleAcceptInvite}
                    loading={isActionPending}
                    style={styles.actionButton}
                  />
                  <Button.Secondary 
                    title="Reject" 
                    onPress={handleRejectInvite}
                    loading={isActionPending}
                    textStyle={{ color: theme.colors.status.error }}
                    style={[styles.actionButton, { borderColor: theme.colors.status.error }]}
                  />
                </View>
              </Animated.View>
            ) : (
              <View style={styles.loadingInviteBox}>
                <Typography.Label style={styles.errorText}>
                  {inviteError || 'Failed to retrieve invitation details.'}
                </Typography.Label>
                <Button.Secondary title="Reload Invite" onPress={() => refreshProfile()} />
              </View>
            )}

            <Animated.View 
              entering={FadeInUp.duration(600).delay(400)}
              style={styles.footer}
            >
              <Pressable 
                onPress={handleSkipOnboarding}
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed ? styles.skipButtonPressed : null
                ]}
              >
                <Typography.Label style={styles.skipText}>
                  Decide Later (Go to Dashboard)
                </Typography.Label>
              </Pressable>
              
              <Pressable 
                onPress={logout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed ? styles.logoutButtonPressed : null
                ]}
              >
                <Typography.Label style={styles.logoutText}>
                  Sign Out of Account
                </Typography.Label>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.setupContainer}>
            <Animated.View 
              entering={FadeInDown.duration(600).springify()} 
              style={styles.header}
            >
              <Typography.Heading style={styles.title}>
                Setup Your Family
              </Typography.Heading>
              <Typography.Paragraph style={styles.subtitle}>
                Hello {user?.full_name || 'there'}! Manage your medical records, checkups, and family health history in one secure place.
              </Typography.Paragraph>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.duration(600).delay(200).springify()}
              style={styles.cardsContainer}
            >
              {/* Create Family Card */}
              <Pressable 
                onPress={handleCreatePress}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.cardPressed : null,
                  { borderCurve: 'continuous' }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                    <Icon 
                      name="person.3.fill" 
                      size={24}
                      tintColor={theme.colors.primary.DEFAULT}
                    />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Typography.Subheading style={styles.cardTitle}>
                      Create a Family
                    </Typography.Subheading>
                    <Typography.Paragraph style={styles.cardDescription}>
                      Start a new family, get an invite code, and add family members to manage their records together.
                    </Typography.Paragraph>
                  </View>
                </View>
                <Button.Primary 
                  title="Create Family" 
                  onPress={handleCreatePress}
                  style={styles.cardButton}
                />
              </Pressable>

              {/* Join Family Card */}
              <Pressable 
                onPress={handleJoinPress}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.cardPressed : null,
                  { borderCurve: 'continuous' }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                    <Icon 
                      name="key.fill" 
                      size={24}
                      tintColor={theme.colors.status.success}
                    />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Typography.Subheading style={styles.cardTitle}>
                      Join a Family
                    </Typography.Subheading>
                    <Typography.Paragraph style={styles.cardDescription}>
                      Have an invite code from a family member? Enter it here to join their existing family.
                    </Typography.Paragraph>
                  </View>
                </View>
                <Button.Secondary 
                  title="Join Family" 
                  onPress={handleJoinPress}
                  style={styles.cardButton}
                />
              </Pressable>
            </Animated.View>

            <Animated.View 
              entering={FadeInUp.duration(600).delay(400)}
              style={styles.footer}
            >
              <Pressable 
                onPress={handleSkipOnboarding}
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed ? styles.skipButtonPressed : null
                ]}
              >
                <Typography.Label style={styles.skipText}>
                  Decide Later (Go to Dashboard)
                </Typography.Label>
              </Pressable>

              <Pressable 
                onPress={logout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed ? styles.logoutButtonPressed : null
                ]}
              >
                <Typography.Label style={styles.logoutText}>
                  Sign Out of Account
                </Typography.Label>
              </Pressable>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing['6xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    color: theme.colors.primary.DEFAULT,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
    lineHeight: theme.lineHeight.md,
  },
  cardsContainer: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  },
  cardPressed: {
    borderColor: theme.colors.border.default,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  cardTextContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  cardButton: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  logoutButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  inviteContainer: {
    gap: theme.spacing.xl,
  },
  setupContainer: {
    gap: theme.spacing.xl,
  },
  loadingInviteBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  loadingInviteText: {
    color: theme.colors.text.secondary,
  },
  inviteCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  },
  inviteCardHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  inviteButtonsContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    width: '100%',
  },
  errorText: {
    color: theme.colors.status.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
