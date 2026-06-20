import { ConsultModal } from '@/components/medicalRecords/ConsultModal';
import { EditMemberModal } from '@/components/medicalRecords/EditMemberModal';
import { InvitesModal } from '@/components/medicalRecords/InvitesModal';
import { MemberAccordion } from '@/components/medicalRecords/MemberAccordion';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { FamilyMemberOut, FamilyMemberResponse, FamilyOut } from '@/src/features/family/familyTypes';
import { MedicalRecordResponse } from '@/src/features/medicalRecords/medicalRecordTypes';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medicalRecords/medicalRecordService';
import { refreshTracker } from '@/src/utils/refreshTracker';
import { isMemberSelf } from '@/src/utils/relation';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LayoutAnimationConfig } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeSkeleton } from '@/components/ui/Skeleton';

export default function Index() {
  const { user, refreshProfile, isFamilyPending, clearFamilyId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Active Family & Records state
  const [family, setFamily] = useState<FamilyOut | null>(null);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Accordion open/close states
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Consult modal states
  const [isConsultVisible, setIsConsultVisible] = useState(false);
  const [activeConsultMember, setActiveConsultMember] = useState<FamilyMemberOut | null>(null);

  // Edit member modal states
  const [isEditMemberVisible, setIsEditMemberVisible] = useState(false);
  const [activeEditMember, setActiveEditMember] = useState<FamilyMemberOut | null>(null);

  // Invites modal states
  const [isInvitesVisible, setIsInvitesVisible] = useState(false);

  // Fetch Family details
  const loadFamilyData = useCallback(async (prefetchedFamily?: FamilyOut) => {
    try {
      // Use pre-fetched data when available (avoids a second API call after verification);
      // otherwise fetch directly (e.g. during surgical refreshes).
      const familyData = prefetchedFamily ?? await familyService.getMyFamily();

      // Fetch the detailed members list. This doubles as the definitive
      // membership check: if the API succeeds but the current user is absent,
      // the family_id on /users/me is stale (backend bug) and we fall back to
      // the onboarding flow silently. If the call fails entirely we can't
      // verify, so we continue with whatever data we have.
      let membersWithSummaries: FamilyMemberResponse[] = [];
      try {
        membersWithSummaries = await familyService.getFamilyMembers();

        // Verify the current user is actually in the members list.
        const isUserInFamily = membersWithSummaries.some(m => isMemberSelf(m, user));
        if (!isUserInFamily) {
          // User not found in family members — treat as "no family" and show
          // the onboarding flow without displaying an error banner.
          setFamily(null);
          clearFamilyId();
          return;
        }
      } catch (err) {
        console.error('Failed to load family member summaries:', err);
        // Cannot verify membership — proceed with family data from /families/me.
      }

      // Merge health summaries and user_id
      const mergedMembers = familyData.members.map(member => {
        const matchingMember = membersWithSummaries.find(m => m.id === member.id);
        return {
          ...member,
          health_summary: matchingMember?.health_summary || member.health_summary || null,
          user_id: matchingMember?.user_id || member.user_id || null,
        };
      });

      // Sort members:
      //   1. Logged-in user's own member (isMemberSelf)
      //   2. Family head (relation === 'Self'), if different from logged-in user
      //   3. Other accepted/non-pending members alphabetically
      //   4. Pending members alphabetically at the very bottom
      const sortedMembers = [...mergedMembers].sort((a, b) => {
        const aIsSelf = isMemberSelf(a, user);
        const bIsSelf = isMemberSelf(b, user);
        if (aIsSelf && !bIsSelf) return -1;
        if (!aIsSelf && bIsSelf) return 1;

        // Pending members go to the bottom
        const aIsPending = a.invite_status === 'pending';
        const bIsPending = b.invite_status === 'pending';
        if (aIsPending && !bIsPending) return 1;
        if (!aIsPending && bIsPending) return -1;

        // Among non-pending, family head (relation 'Self') comes first
        const aIsHead = a.relation.toLowerCase() === 'self';
        const bIsHead = b.relation.toLowerCase() === 'self';
        if (aIsHead && !bIsHead) return -1;
        if (!aIsHead && bIsHead) return 1;

        return a.name.localeCompare(b.name);
      });

      setFamily({
        ...familyData,
        members: sortedMembers,
      });

      // Expand the first member who has records by default, or the owner
      if (sortedMembers.length > 0) {
        const defaultExpandedId = sortedMembers[0].id;
        setExpandedMembers(prev => {
          if (Object.keys(prev).length > 0) return prev;
          return { [defaultExpandedId]: true };
        });
      }
    } catch (err: unknown) {
      // Clear stale family data so the UI doesn't show records the user
      // can no longer access (handles backend bug where family_id is stale).
      setFamily(null);
      clearFamilyId();
      const message = err instanceof Error ? err.message : 'Failed to load family details';
      setError(message);
    }
  }, [user, clearFamilyId]);

  // Fetch Medical Records
  const loadRecordsData = useCallback(async () => {
    try {
      const recordsData = await medicalRecordService.listMedicalRecords();
      setRecords(recordsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load health records';
      setError(message);
    }
  }, []);

  // Fetch Family details and Medical Records
  const loadDashboardData = useCallback(async () => {
    setError(null);
    try {
      // Refresh user profile first to ensure we have the latest family_id
      const updatedUser = await refreshProfile();

      if (!updatedUser?.family_id) {
        setFamily(null);
        setRecords([]);
        setLoading(false);
        return;
      }

      // Verify actual family membership via GET /families/me.
      // This guards against a backend bug where /users/me returns a stale
      // family_id even though the user is no longer in the family.
      // Pre-fetch the family data here so loadFamilyData can reuse it
      // without making a second network round-trip.
      let verifiedFamily: FamilyOut | undefined;
      try {
        verifiedFamily = await familyService.getMyFamily();
      } catch {
        // family_id present but membership check failed — treat as no family.
        setFamily(null);
        clearFamilyId();
        setRecords([]);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadFamilyData(verifiedFamily),
        loadRecordsData(),
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load health records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, loadFamilyData, loadRecordsData, clearFamilyId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const isInitial = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isInitial.current) {
        isInitial.current = false;
        loadDashboardData();
        return;
      }

      const needsProfile = refreshTracker.getAndReset('profile');
      const needsFamily = refreshTracker.getAndReset('family');
      const needsRecords = refreshTracker.getAndReset('records');

      if (needsProfile || needsFamily || needsRecords) {
        const performSurgicalRefresh = async () => {
          try {
            let currentFamilyId = family?.id;

            if (needsProfile) {
              const updatedUser = await refreshProfile();
              if (updatedUser?.family_id !== currentFamilyId) {
                // If family ID has changed, we must reload everything!
                loadDashboardData();
                return;
              }
            }

            // If we need to refresh family or the profile changed (which might affect member list names/details)
            if (needsFamily || needsProfile) {
              await loadFamilyData();
            }

            if (needsRecords) {
              await loadRecordsData();
            }
          } catch (err) {
            console.error('Surgical refresh failed:', err);
          }
        };
        performSurgicalRefresh();
      }
    }, [loadDashboardData, refreshProfile, loadFamilyData, loadRecordsData, family])
  );

  // Toggle Accordion
  const toggleExpand = useCallback((memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: prev[memberId] ? false : true,
    }));
  }, []);

  // Consult modal handlers
  const handleOpenConsult = useCallback((member: FamilyMemberOut) => {
    setActiveConsultMember(member);
    setIsConsultVisible(true);
  }, []);

  const handleCloseConsult = useCallback(() => {
    setIsConsultVisible(false);
    setActiveConsultMember(null);
  }, []);

  const handleOpenEditMember = useCallback((member: FamilyMemberOut) => {
    setActiveEditMember(member);
    setIsEditMemberVisible(true);
  }, []);

  const handleCloseEditMember = useCallback(() => {
    setIsEditMemberVisible(false);
    setActiveEditMember(null);
  }, []);

  const handleOpenInvites = useCallback((): void => {
    setIsInvitesVisible(true);
  }, []);

  const handleCloseInvites = useCallback((): void => {
    setIsInvitesVisible(false);
  }, []);

  // Copy Invite Code handler
  const handleCopyCode = useCallback(async () => {
    if (!family?.invite_code) return;
    await Clipboard.setStringAsync(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [family]);

  // Navigation handlers
  const handleNavigateProfile = useCallback(() => {
    router.push('/profile');
  }, [router]);

  const handleNavigateCreateRecord = useCallback((memberId: string) => {
    router.push({
      pathname: '/medicalRecords/create',
      params: { memberId },
    });
  }, [router]);

  const handleNavigateRecordDetails = useCallback((recordId: string) => {
    router.push(`/medicalRecords/${recordId}`);
  }, [router]);

  const handleNavigateCreateFamily = useCallback(() => {
    router.push('/family/create');
  }, [router]);

  const handleNavigateJoinFamily = useCallback(() => {
    router.push('/family/join');
  }, [router]);

  const handleNavigateAddMember = useCallback(() => {
    router.push('/family/addMember');
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Typography.Subheading style={styles.headerTitle}>
          AlgoHealth Plus
        </Typography.Subheading>
 
        <View style={styles.headerActions}>
          {isFamilyPending ? (
            <Pressable
              onPress={handleOpenInvites}
              style={({ pressed }) => [
                styles.invitesButton,
                pressed ? styles.invitesButtonPressed : null,
                { borderCurve: 'continuous' }
              ]}
            >
              <Icon
                name={IconName.EnvelopeFill}
                size={20}
                tintColor={theme.colors.primary.DEFAULT}
              />
              <View style={styles.badgeDot} />
            </Pressable>
          ) : null}
 
          {/* Profile icon top right */}
          <Pressable
            onPress={handleNavigateProfile}
            style={({ pressed }) => [
              styles.profileButton,
              pressed ? styles.profileButtonPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <Icon
              name={IconName.PersonCropCircleFill}
              size={20}
              tintColor={theme.colors.primary.DEFAULT}
            />
            <Typography.Label style={styles.profileText}>
              Profile
            </Typography.Label>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.DEFAULT]}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.welcomeSection}>
          <Typography.Heading style={styles.title}>
            My Family
          </Typography.Heading>
          <Typography.Paragraph style={styles.description}>
            View and manage medical history for your family.
          </Typography.Paragraph>
        </Animated.View>

        {loading ? (
          <HomeSkeleton />
        ) : (
          <LayoutAnimationConfig>
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.dashboardBody}>

              <View style={styles.sectionsContainer}>
                {/* Active Family Circle Card */}
                {family ? (
                  <View style={styles.familyContainer}>
                    <View style={styles.familyHeader}>
                      <View style={styles.familyHeaderRow}>
                        <View style={styles.familyTitleContainer}>
                          <Typography.Subheading style={styles.cardTitle}>
                            {family.name}
                          </Typography.Subheading>
                          <Typography.Paragraph style={styles.cardSubtitle}>
                            {isFamilyPending
                              ? 'You have a pending invitation to join this family.'
                              : 'Tap a family member to view their medical records.'}
                          </Typography.Paragraph>
                        </View>

                        {/* Share invite code pill — only visible to full members */}
                        {isFamilyPending ? null : (
                          <Pressable
                            onPress={handleCopyCode}
                            style={({ pressed }) => [
                              styles.inviteBadge,
                              pressed ? styles.inviteBadgePressed : null,
                              { borderCurve: 'continuous' }
                            ]}
                          >
                            <Icon
                              name={copied ? IconName.Checkmark : IconName.DocOnDocFill}
                              size={14}
                              tintColor={copied ? theme.colors.status.success : theme.colors.primary.DEFAULT}
                            />
                            <Typography.Label style={[styles.badgeText, copied ? styles.badgeTextSuccess : null]}>
                              {copied ? 'Copied' : `Invite: ${family.invite_code}`}
                            </Typography.Label>
                          </Pressable>
                        )}
                      </View>

                      {isFamilyPending ? null : (
                        <Typography.Paragraph style={styles.inviteInstructions}>
                          Share this invite code with family members so they can enter it in their &quot;Join Family&quot; screen to join this family.
                        </Typography.Paragraph>
                      )}
                    </View>

                    <View style={styles.divider} />

                    {/* Pending-invite users cannot manage members or see the member list */}
                    {isFamilyPending ? (
                      <View style={styles.pendingNotice}>
                        <Icon
                          name={IconName.EnvelopeFill}
                          size={20}
                          tintColor={theme.colors.primary.DEFAULT}
                        />
                        <Typography.Paragraph style={styles.pendingNoticeText}>
                          Accept your pending invitation to access family members and medical records.
                        </Typography.Paragraph>
                        <Button.Primary
                          title="View Invitation"
                          onPress={handleOpenInvites}
                          style={styles.pendingNoticeButton}
                        />
                      </View>
                    ) : (
                      <>
                        {/* Add Family Member CTA */}
                        <Button.Secondary
                          title="Add Family Member"
                          onPress={handleNavigateAddMember}
                          iconName={IconName.PersonBadgePlus}
                          iconColor={theme.colors.primary.DEFAULT}
                          style={styles.addMemberButton}
                          textStyle={styles.addMemberText}
                        />

                        {/* ACCORDION SECTION GROUPED BY FAMILY MEMBER */}
                        {family.members.length > 0 ? (
                          <View style={styles.accordionsList}>
                            {family.members.map((member) => {
                              const isExpanded = expandedMembers[member.id] || false;

                              // Filter records for this member
                              const memberRecords = records.filter(
                                (r) => r.family_member_id === member.id
                              );

                              return (
                                <MemberAccordion
                                  key={member.id}
                                  member={member}
                                  records={memberRecords}
                                  isExpanded={isExpanded}
                                  onToggleExpand={toggleExpand}
                                  onNavigateCreateRecord={handleNavigateCreateRecord}
                                  onNavigateRecordDetails={handleNavigateRecordDetails}
                                  onConsult={handleOpenConsult}
                                  onEditMember={handleOpenEditMember}
                                />
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.emptyState}>
                            <Typography.Paragraph style={styles.emptyStateText}>
                              No family members registered in this family.
                            </Typography.Paragraph>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.errorContainer}>
                    {error ? (
                      <Typography.Paragraph style={styles.errorText}>
                        {error}
                      </Typography.Paragraph>
                    ) : (
                      <Typography.Paragraph style={styles.errorText}>
                        No active family found.
                      </Typography.Paragraph>
                    )}
                  </View>
                )}

                {/* Separator between family card and settings actions */}
                {family ? <View style={styles.separator} /> : null}

                {/* Create/Join actions — shown whenever verified family state is null,
                    even if user.family_id is set (backend bug / stale data). */}
                {family ? null : (
                  <View style={styles.actionsContainer}>
                    <Typography.Subheading style={styles.actionsTitle}>
                      Get Started
                    </Typography.Subheading>
                    <Typography.Paragraph style={styles.actionsDesc}>
                      Create a new family circle or join an existing one with an invite code.
                    </Typography.Paragraph>
                    <View style={styles.actionsRow}>
                      <Button.Secondary
                        title="New Family"
                        onPress={handleNavigateCreateFamily}
                        iconName={IconName.Person3Fill}
                        iconColor={theme.colors.primary.DEFAULT}
                        style={styles.actionButton}
                        textStyle={styles.actionButtonText}
                      />

                      <Button.Secondary
                        title="Join Family"
                        onPress={handleNavigateJoinFamily}
                        iconName={IconName.KeyFill}
                        iconColor={theme.colors.status.success}
                        style={styles.actionButton}
                        textStyle={styles.actionButtonText}
                      />
                    </View>
                  </View>
                )}
              </View>
 
            </Animated.View>
          </LayoutAnimationConfig>
        )}
      </ScrollView>
 
      <ConsultModal
        visible={isConsultVisible}
        member={activeConsultMember}
        onClose={handleCloseConsult}
      />
 
      <EditMemberModal
        visible={isEditMemberVisible}
        member={activeEditMember}
        onClose={handleCloseEditMember}
        onUpdateSuccess={loadDashboardData}
        ownerId={family?.owner_id || null}
      />
 
      <InvitesModal
        visible={isInvitesVisible}
        onClose={handleCloseInvites}
        onActionSuccess={loadDashboardData}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  invitesButton: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  invitesButtonPressed: {
    opacity: 0.7,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.status.error,
    borderWidth: 1.5,
    borderColor: theme.colors.background.surface,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  profileButtonPressed: {
    opacity: 0.7,
  },
  profileIcon: {
    width: 18,
    height: 18,
  },
  profileText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
    ...shadows.md,
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
  familyContainer: {
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.lg,
  },
  errorContainer: {
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  actionsContainer: {
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  familyHeader: {
    flexDirection: 'column',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  inviteInstructions: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    lineHeight: theme.lineHeight.xs,
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
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.purpleLight,
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
  accordionsList: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateText: {
    color: theme.colors.text.tertiary,
  },
  errorText: {
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  addMemberButtonPressed: {
    backgroundColor: theme.colors.border.light,
  },
  addMemberIcon: {
    width: 18,
    height: 18,
  },
  addMemberText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
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
  pendingNotice: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  pendingNoticeText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  pendingNoticeButton: {
    width: '100%',
  },
});
