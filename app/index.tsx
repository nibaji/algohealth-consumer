import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { FamilyOut, FamilyMemberOut } from '@/src/features/family/familyTypes';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';
import { ConsultModal } from '@/components/medical-records/consult-modal';
import Animated, { FadeInDown, LayoutAnimationConfig } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { MemberAccordion } from '@/components/medical-records/member-accordion';
import { EditMemberModal } from '@/components/medical-records/edit-member-modal';

export default function Index() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  // Active Family & Records state
  const [family, setFamily] = useState<FamilyOut | null>(null);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion open/close states
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Track initial load to show full screen spinner only once
  const isInitialLoad = React.useRef(true);

  // Consult modal states
  const [isConsultVisible, setIsConsultVisible] = useState(false);
  const [activeConsultMember, setActiveConsultMember] = useState<FamilyMemberOut | null>(null);

  // Edit member modal states
  const [isEditMemberVisible, setIsEditMemberVisible] = useState(false);
  const [activeEditMember, setActiveEditMember] = useState<FamilyMemberOut | null>(null);

  // Fetch Family details and Medical Records
  const loadDashboardData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
      isInitialLoad.current = false;
    }
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

      const [familyData, recordsData] = await Promise.all([
        familyService.getMyFamily(),
        medicalRecordService.listMedicalRecords(),
      ]);
      
      setFamily(familyData);
      setRecords(recordsData);

      // Expand the first member who has records by default, or the owner
      if (familyData.members.length > 0) {
        const defaultExpandedId = familyData.members[0].id;
        setExpandedMembers(prev => {
          if (Object.keys(prev).length > 0) return prev;
          return { [defaultExpandedId]: true };
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load health records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
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
      pathname: '/medical-records/create',
      params: { memberId },
    });
  }, [router]);

  const handleNavigateRecordDetails = useCallback((recordId: string) => {
    router.push(`/medical-records/${recordId}`);
  }, [router]);

  const handleNavigateCreateFamily = useCallback(() => {
    router.push('/family/create');
  }, [router]);

  const handleNavigateJoinFamily = useCallback(() => {
    router.push('/family/join');
  }, [router]);

  const handleNavigateAddMember = useCallback(() => {
    router.push('/family/add-member');
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Typography.Subheading style={styles.headerTitle}>
          AlgoHealth Plus
        </Typography.Subheading>
        
        {/* Profile icon top right */}
        <Pressable 
          onPress={handleNavigateProfile}
          style={({ pressed }) => [
            styles.profileButton,
            pressed ? styles.profileButtonPressed : null,
            { borderCurve: 'continuous' }
          ]}
        >
          <Image 
            source="sf:person.crop.circle.fill" 
            style={[styles.profileIcon, { tintColor: theme.colors.primary.DEFAULT }]} 
          />
          <Typography.Label style={styles.profileText}>
            Profile
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
            Health Circle
          </Typography.Heading>
          <Typography.Paragraph style={styles.description}>
            View and manage medical history for your circle.
          </Typography.Paragraph>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : (
          <LayoutAnimationConfig>
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.dashboardBody}>
              
              {/* Active Family Circle Card */}
              {family ? (
                <View style={[styles.card, { borderCurve: 'continuous' }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.familyTitleContainer}>
                      <Typography.Subheading style={styles.cardTitle}>
                        {family.name}
                      </Typography.Subheading>
                      <Typography.Paragraph style={styles.cardSubtitle}>
                        Tap a family member to view their medical records.
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
                        {copied ? 'Copied' : `Invite: ${family.invite_code}`}
                      </Typography.Label>
                    </Pressable>
                  </View>

                  <View style={styles.divider} />

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
                            onToggleExpand={() => toggleExpand(member.id)}
                            onNavigateCreateRecord={() => handleNavigateCreateRecord(member.id)}
                            onNavigateRecordDetails={handleNavigateRecordDetails}
                            onConsult={() => handleOpenConsult(member)}
                            onEditMember={() => handleOpenEditMember(member)}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Typography.Paragraph style={styles.emptyStateText}>
                        No family members registered in this circle.
                      </Typography.Paragraph>
                    </View>
                  )}

                  {/* Add Family Member CTA */}
                  <Pressable
                    onPress={handleNavigateAddMember}
                    style={({ pressed }) => [
                      styles.addMemberButton,
                      pressed ? styles.addMemberButtonPressed : null,
                      { borderCurve: 'continuous' }
                    ]}
                  >
                    <Image 
                      source="sf:person.badge.plus" 
                      style={[styles.addMemberIcon, { tintColor: theme.colors.primary.DEFAULT }]} 
                    />
                    <Typography.Label style={styles.addMemberText}>
                      Add Family Member
                    </Typography.Label>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.card, { borderCurve: 'continuous' }]}>
                  <Typography.Paragraph style={styles.errorText}>
                    {error ? error : 'No active family circle found. Setup family circle to get started.'}
                  </Typography.Paragraph>
                </View>
              )}

              {/* Circle Actions (Switch/Create/Join post-onboarding) */}
              {user?.family_id ? null : (
                <View style={[styles.actionsCard, { borderCurve: 'continuous' }]}>
                  <Typography.Subheading style={styles.actionsTitle}>
                    Circle Settings
                  </Typography.Subheading>
                  <Typography.Paragraph style={styles.actionsDesc}>
                    Need to switch circles? Start a new family circle or join another circle using a different invite code.
                  </Typography.Paragraph>
                  <View style={styles.actionsRow}>
                    <Pressable 
                      onPress={handleNavigateCreateFamily}
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
                      onPress={handleNavigateJoinFamily}
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
              )}

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
    color: theme.colors.text.secondary,
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
  accordionsList: {
    gap: theme.spacing.md,
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
    marginTop: theme.spacing.lg,
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
  
  // Switch actions card styles
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
