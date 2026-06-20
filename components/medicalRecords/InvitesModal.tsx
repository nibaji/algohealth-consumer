import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { StyleSheet, View, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InvitesSkeleton } from '@/components/ui/Skeleton';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { theme, shadows } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { FamilyMemberOut, FamilyOut } from '@/src/features/family/familyTypes';
import { refreshTracker } from '@/src/utils/refreshTracker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getDisplayRelationFromRelation } from '@/src/utils/relation';

interface InvitesModalProps {
  visible: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
}

export const InvitesModal: React.FC<InvitesModalProps> = React.memo(({ visible, onClose, onActionSuccess }) => {
  const insets = useSafeAreaInsets();
  const { refreshProfile, isFamilyPending } = useAuth();
  const [pendingFamily, setPendingFamily] = useState<FamilyOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startActionTransition] = useTransition();

  useEffect(() => {
    if (visible && isFamilyPending) {
      const fetchInviteDetails = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
          const familyData = await familyService.getMyFamily();
          setPendingFamily(familyData);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to load pending invite';
          setError(msg);
        } finally {
          setLoading(false);
        }
      };
      fetchInviteDetails();
    } else {
      setPendingFamily(null);
    }
  }, [visible, isFamilyPending]);

  const handleAccept = useCallback((): void => {
    if (!pendingFamily) return;
    setError(null);
    startActionTransition(async () => {
      try {
        await familyService.joinFamily({
          family_id: pendingFamily.id,
        });
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        refreshTracker.setNeedsRefresh('profile', true);
        refreshTracker.setNeedsRefresh('records', true);
        onActionSuccess();
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to accept invitation';
        setError(msg);
      }
    });
  }, [pendingFamily, refreshProfile, onActionSuccess, onClose]);

  const handleReject = useCallback((): void => {
    if (!pendingFamily) return;
    setError(null);
    startActionTransition(async () => {
      try {
        await familyService.rejectFamily({
          family_id: pendingFamily.id,
        });
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        refreshTracker.setNeedsRefresh('profile', true);
        onActionSuccess();
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reject invitation';
        setError(msg);
      }
    });
  }, [pendingFamily, refreshProfile, onActionSuccess, onClose]);

  const handleReload = useCallback((): void => {
    refreshProfile();
  }, [refreshProfile]);

  // Accepted (non-pending) members to show in the read-only list
  const acceptedMembers: FamilyMemberOut[] = pendingFamily
    ? pendingFamily.members.filter((m) => m.invite_status !== 'pending')
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        {/* Header bar */}
        <View style={[styles.headerBar, process.env.EXPO_OS !== 'ios' ? { paddingTop: insets.top, height: 56 + insets.top } : null]}>
          <Pressable 
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Icon name={IconName.Xmark} size={20} tintColor={theme.colors.text.primary} />
          </Pressable>
          <Typography.Subheading style={styles.headerTitle}>
            Pending Invitations
          </Typography.Subheading>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {loading ? (
            <InvitesSkeleton />
          ) : pendingFamily ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.inviteDetails}>
              {/* Invite card */}
              <View style={[styles.card, { borderCurve: 'continuous' }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Icon name={IconName.EnvelopeFill} size={24} tintColor={theme.colors.primary.DEFAULT} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Typography.Heading style={styles.cardTitle}>
                      {pendingFamily.name}
                    </Typography.Heading>
                    <Typography.Paragraph style={styles.cardDescription}>
                      {"You've been invited to join this family circle. Once accepted, you will share medical records with other members."}
                    </Typography.Paragraph>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Icon
                      name={IconName.ExclamationmarkCircleFill}
                      size={16}
                      tintColor={theme.colors.text.error}
                    />
                    <Typography.Label style={styles.errorText}>
                      {error}
                    </Typography.Label>
                  </View>
                ) : null}

                <View style={styles.actionsContainer}>
                  <Button.Primary 
                    title="Accept Invite" 
                    onPress={handleAccept}
                    loading={isPending}
                    style={styles.actionButton}
                  />
                  <Button.Secondary 
                    title="Reject" 
                    onPress={handleReject}
                    loading={isPending}
                    textStyle={styles.rejectText}
                    style={styles.rejectButton}
                  />
                </View>
              </View>

              {/* Read-only family members list */}
              {acceptedMembers.length > 0 ? (
                <View style={styles.membersSection}>
                  <Typography.Label style={styles.membersSectionTitle}>
                    Family Members
                  </Typography.Label>
                  <View style={[styles.membersCard, { borderCurve: 'continuous' }]}>
                    {acceptedMembers.map((member, index) => (
                      <ReadOnlyMemberRow
                        key={member.id}
                        member={member}
                        isLast={index === acceptedMembers.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <Typography.Paragraph style={styles.emptyText}>
                {error || 'No pending invitations found.'}
              </Typography.Paragraph>
              <Button.Secondary title="Reload" onPress={handleReload} />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});

InvitesModal.displayName = 'InvitesModal';

// ---------------------------------------------------------------------------
// Read-only member row (no edit/consult — purely informational)
// ---------------------------------------------------------------------------

interface ReadOnlyMemberRowProps {
  member: FamilyMemberOut;
  isLast: boolean;
}

const ReadOnlyMemberRow: React.FC<ReadOnlyMemberRowProps> = React.memo(({ member, isLast }) => {
  const relationLabel = getDisplayRelationFromRelation(member.relation);

  return (
    <View style={[styles.memberRow, isLast ? null : styles.memberRowBorder]}>
      <View style={styles.memberAvatar}>
        <Typography.Label style={styles.memberAvatarText}>
          {member.name.charAt(0).toUpperCase()}
        </Typography.Label>
      </View>
      <View style={styles.memberInfo}>
        <Typography.Paragraph style={styles.memberName}>
          {member.name}
        </Typography.Paragraph>
        <Typography.Label style={styles.memberRelation}>
          {relationLabel}
        </Typography.Label>
      </View>
    </View>
  );
});

ReadOnlyMemberRow.displayName = 'ReadOnlyMemberRow';

// ---------------------------------------------------------------------------

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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  inviteDetails: {
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    ...shadows.sm,
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
    backgroundColor: theme.colors.background.purpleLight,
  },
  cardTextContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text.primary,
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  actionsContainer: {
    gap: theme.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  rejectButton: {
    width: '100%',
    borderColor: theme.colors.status.error,
  },
  rejectText: {
    color: theme.colors.status.error,
  },
  errorBanner: {
    backgroundColor: theme.colors.background.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.text.error,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
  },
  // Members section
  membersSection: {
    gap: theme.spacing.sm,
  },
  membersSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.xs,
  },
  membersCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
    ...shadows.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  memberRelation: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});
