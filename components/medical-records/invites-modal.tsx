import React, { useState, useEffect, useTransition } from 'react';
import { StyleSheet, View, Modal, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { FamilyOut } from '@/src/features/family/familyTypes';
import { refreshTracker } from '@/src/utils/refreshTracker';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
      const fetchInviteDetails = async () => {
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

  const handleAccept = React.useCallback(() => {
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

  const handleReject = React.useCallback(() => {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        {/* Header bar */}
        <View style={[styles.headerBar, Platform.OS !== 'ios' ? { paddingTop: insets.top, height: 56 + insets.top } : null]}>
          <Pressable 
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Icon name="xmark" size={20} tintColor={theme.colors.text.primary} />
          </Pressable>
          <Typography.Subheading style={styles.headerTitle}>
            Pending Invitations
          </Typography.Subheading>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
              <Typography.Paragraph style={styles.loadingText}>
                Loading invitation details...
              </Typography.Paragraph>
            </View>
          ) : pendingFamily ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.inviteDetails}>
              <View style={[styles.card, { borderCurve: 'continuous' }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Icon name="envelope.fill" size={24} tintColor={theme.colors.primary.DEFAULT} />
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
                  <Typography.Label style={styles.errorText}>
                    {error}
                  </Typography.Label>
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
                    textStyle={{ color: theme.colors.status.error }}
                    style={[styles.actionButton, { borderColor: theme.colors.status.error }]}
                  />
                </View>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <Typography.Paragraph style={styles.emptyText}>
                {error || 'No pending invitations found.'}
              </Typography.Paragraph>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
});

InvitesModal.displayName = 'InvitesModal';

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
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  inviteDetails: {
    width: '100%',
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.lg,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
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
    backgroundColor: '#F3E8FF',
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
  errorText: {
    color: theme.colors.status.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
  },
});
