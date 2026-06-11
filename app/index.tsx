import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { FamilyOut } from '@/src/features/family/familyTypes';
import Animated, { FadeInDown, LayoutAnimationConfig } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [family, setFamily] = useState<FamilyOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Family details
  const fetchFamily = useCallback(async () => {
    if (!user?.family_id) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await familyService.getMyFamily();
      setFamily(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch family circle';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.family_id]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  // Copy Invite Code handler
  const handleCopyCode = useCallback(async () => {
    if (!family?.invite_code) return;
    await Clipboard.setStringAsync(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [family]);

  const handleNavigateCreate = useCallback(() => {
    router.push('/family/create');
  }, [router]);

  const handleNavigateJoin = useCallback(() => {
    router.push('/family/join');
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Typography.Subheading style={styles.headerTitle}>
          AlgoHealth Dashboard
        </Typography.Subheading>
        <Pressable 
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed ? styles.logoutButtonPressed : null
          ]}
        >
          <Typography.Label style={styles.logoutText}>
            Sign Out
          </Typography.Label>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.welcomeSection}>
          <Typography.Heading style={styles.title}>
            Welcome back!
          </Typography.Heading>
          <Typography.Paragraph style={styles.description}>
            {user?.full_name ? `Hello, ${user.full_name}` : `Hello, ${user?.email}`}
          </Typography.Paragraph>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : (
          <LayoutAnimationConfig>
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.dashboardBody}>
              
              {/* Active Family Circle Details */}
              {family ? (
                <View style={[styles.card, { borderCurve: 'continuous' }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.familyTitleContainer}>
                      <Typography.Subheading style={styles.cardTitle}>
                        {family.name}
                      </Typography.Subheading>
                      <Typography.Paragraph style={styles.cardSubtitle}>
                        Active Health Circle
                      </Typography.Paragraph>
                    </View>
                    
                    {/* Share invite code pill */}
                    <Pressable 
                      onPress={handleCopyCode}
                      style={({ pressed }) => [
                        styles.inviteBadge,
                        pressed ? styles.inviteBadgePressed : null,
                        { borderCurve: 'continuous' }
                      ]}
                    >
                      <Image 
                        source={copied ? "sf:checkmark" : "sf:square.and.arrow.up"} 
                        style={[styles.badgeIcon, { tintColor: copied ? theme.colors.status.success : theme.colors.primary.DEFAULT }]} 
                      />
                      <Typography.Label style={[styles.badgeText, copied ? styles.badgeTextSuccess : null]}>
                        {copied ? 'Copied' : `Code: ${family.invite_code}`}
                      </Typography.Label>
                    </Pressable>
                  </View>

                  <View style={styles.divider} />

                  <Typography.Label style={styles.sectionHeader}>
                    MEMBERS ({family.members.length})
                  </Typography.Label>

                  {family.members.length > 0 ? (
                    <View style={styles.membersList}>
                      {family.members.map((member) => (
                        <View key={member.id} style={styles.memberRow}>
                          <View style={styles.avatar}>
                            <Typography.Label style={styles.avatarText}>
                              {member.name.charAt(0).toUpperCase()}
                            </Typography.Label>
                          </View>
                          <View style={styles.memberInfo}>
                            <Typography.Paragraph style={styles.memberName}>
                              {member.name}
                            </Typography.Paragraph>
                            <Typography.Label style={styles.memberRelation}>
                              {member.relation}
                            </Typography.Label>
                          </View>
                          {member.invite_status ? (
                            <View 
                              style={[
                                styles.statusBadge, 
                                member.invite_status === 'ACCEPTED' ? styles.statusBadgeAccepted : styles.statusBadgePending,
                                { borderCurve: 'continuous' }
                              ]}
                            >
                              <Typography.Label 
                                style={[
                                  styles.statusText,
                                  member.invite_status === 'ACCEPTED' ? styles.statusTextAccepted : styles.statusTextPending
                                ]}
                              >
                                {member.invite_status}
                              </Typography.Label>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Typography.Paragraph style={styles.emptyStateText}>
                        No family members registered in this circle.
                      </Typography.Paragraph>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.card, { borderCurve: 'continuous' }]}>
                  <Typography.Paragraph style={styles.errorText}>
                    {error ? error : 'No active family circle found. Setup family circle to get started.'}
                  </Typography.Paragraph>
                </View>
              )}

              {/* Quick Actions post-onboarding */}
              <View style={[styles.actionsCard, { borderCurve: 'continuous' }]}>
                <Typography.Subheading style={styles.actionsTitle}>
                  Circle Actions
                </Typography.Subheading>
                <Typography.Paragraph style={styles.actionsDesc}>
                  You can start another family circle or switch circles by joining with a new invite code.
                </Typography.Paragraph>
                <View style={styles.actionsRow}>
                  <Pressable 
                    onPress={handleNavigateCreate}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed ? styles.actionButtonPressed : null,
                      { borderCurve: 'continuous' }
                    ]}
                  >
                    <Image source="sf:plus.circle.fill" style={[styles.actionIcon, { tintColor: theme.colors.primary.DEFAULT }]} />
                    <Typography.Label style={styles.actionButtonText}>
                      New Family
                    </Typography.Label>
                  </Pressable>

                  <Pressable 
                    onPress={handleNavigateJoin}
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed ? styles.actionButtonPressed : null,
                      { borderCurve: 'continuous' }
                    ]}
                  >
                    <Image source="sf:arrow.right.to.line.cycle" style={[styles.actionIcon, { tintColor: theme.colors.status.success }]} />
                    <Typography.Label style={styles.actionButtonText}>
                      Join Circle
                    </Typography.Label>
                  </Pressable>
                </View>
              </View>

            </Animated.View>
          </LayoutAnimationConfig>
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
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  logoutButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  logoutText: {
    color: theme.colors.status.error,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  welcomeSection: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.primary.DEFAULT,
  },
  description: {
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  dashboardBody: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  familyTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#F3E8FF',
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
  },
  inviteBadgePressed: {
    opacity: 0.8,
  },
  badgeIcon: {
    width: 14,
    height: 14,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: theme.colors.status.success,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.md,
  },
  sectionHeader: {
    color: theme.colors.text.tertiary,
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  membersList: {
    gap: theme.spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  memberRelation: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  statusBadgeAccepted: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextAccepted: {
    color: theme.colors.status.success,
  },
  statusTextPending: {
    color: theme.colors.status.warning,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    color: theme.colors.text.tertiary,
  },
  errorText: {
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  
  // Actions card styles
  actionsCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  actionsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  actionsDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.xs,
  },
  actionButtonPressed: {
    backgroundColor: theme.colors.border.light,
  },
  actionIcon: {
    width: 18,
    height: 18,
  },
  actionButtonText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
