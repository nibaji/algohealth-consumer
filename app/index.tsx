import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { familyService } from '@/src/services/family/familyService';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { FamilyOut } from '@/src/features/family/familyTypes';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';
import Animated, { FadeInDown, LayoutAnimationConfig } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user } = useAuth();
  const router = useRouter();

  // Active Family & Records state
  const [family, setFamily] = useState<FamilyOut | null>(null);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion open/close states
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Fetch Family details and Medical Records
  const loadDashboardData = useCallback(async () => {
    if (!user?.family_id) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [familyData, recordsData] = await Promise.all([
        familyService.getMyFamily(),
        medicalRecordService.listMedicalRecords(),
      ]);
      
      setFamily(familyData);
      setRecords(recordsData);

      // Expand the first member who has records by default, or the owner
      if (familyData.members.length > 0) {
        const defaultExpandedId = familyData.members[0].id;
        setExpandedMembers(prev => ({
          [defaultExpandedId]: true,
          ...prev
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load health records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.family_id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Toggle Accordion
  const toggleExpand = useCallback((memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: prev[memberId] ? false : true,
    }));
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

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Typography.Subheading style={styles.headerTitle}>
          AlgoHealth
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
                          <View 
                            key={member.id} 
                            style={[
                              styles.accordionCard, 
                              isExpanded ? styles.accordionCardExpanded : null,
                              { borderCurve: 'continuous' }
                            ]}
                          >
                            {/* Accordion Header */}
                            <Pressable 
                              onPress={() => toggleExpand(member.id)}
                              style={styles.accordionHeader}
                            >
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
                                  {member.relation} • {memberRecords.length} {memberRecords.length === 1 ? 'Record' : 'Records'}
                                </Typography.Label>
                              </View>
                              <Image 
                                source={isExpanded ? "sf:chevron.up" : "sf:chevron.down"} 
                                style={[styles.chevronIcon, { tintColor: theme.colors.text.tertiary }]} 
                              />
                            </Pressable>

                            {/* Accordion Content */}
                            {isExpanded ? (
                              <Animated.View entering={FadeInDown.duration(300)} style={styles.accordionContent}>
                                <View style={styles.accordionDivider} />
                                
                                {memberRecords.length > 0 ? (
                                  <View style={styles.recordsList}>
                                    {memberRecords.map((recordItem) => (
                                      <Pressable
                                        key={recordItem.id}
                                        onPress={() => handleNavigateRecordDetails(recordItem.id)}
                                        style={({ pressed }) => [
                                          styles.recordItemCard,
                                          pressed ? styles.recordItemCardPressed : null,
                                          { borderCurve: 'continuous' }
                                        ]}
                                      >
                                        <View style={styles.recordRow}>
                                          <View style={styles.recordLeft}>
                                            <Typography.Paragraph style={styles.recordComplaint}>
                                              {recordItem.chief_complaint || 'General Checkup'}
                                            </Typography.Paragraph>
                                            <Typography.Label style={styles.recordContext}>
                                              {recordItem.primary_context || 'Location not specified'}
                                            </Typography.Label>
                                          </View>
                                          <View style={styles.recordRight}>
                                            <Typography.Label style={styles.recordDate}>
                                              {recordItem.visit_date}
                                            </Typography.Label>
                                            <Image source="sf:chevron.right" style={styles.arrowRightIcon} />
                                          </View>
                                        </View>
                                        {recordItem.ai_summary ? (
                                          <View style={styles.aiBadgeContainer}>
                                            <Image source="sf:sparkles" style={styles.sparklesMini} />
                                            <Typography.Label numberOfLines={1} style={styles.aiBadgeText}>
                                              {recordItem.ai_summary}
                                            </Typography.Label>
                                          </View>
                                        ) : null}
                                      </Pressable>
                                    ))}
                                  </View>
                                ) : (
                                  <View style={styles.emptyRecords}>
                                    <Typography.Paragraph style={styles.emptyRecordsText}>
                                      No medical records logged yet.
                                    </Typography.Paragraph>
                                  </View>
                                )}

                                {/* Add record for this member shortcut */}
                                <Pressable
                                  onPress={() => handleNavigateCreateRecord(member.id)}
                                  style={({ pressed }) => [
                                    styles.addRecordShortcutButton,
                                    pressed ? styles.addRecordShortcutButtonPressed : null,
                                    { borderCurve: 'continuous' }
                                  ]}
                                >
                                  <Image source="sf:plus" style={styles.plusMini} />
                                  <Typography.Label style={styles.addRecordShortcutText}>
                                    Add Medical Record
                                  </Typography.Label>
                                </Pressable>
                              </Animated.View>
                            ) : null}
                          </View>
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
                </View>
              ) : (
                <View style={[styles.card, { borderCurve: 'continuous' }]}>
                  <Typography.Paragraph style={styles.errorText}>
                    {error ? error : 'No active family circle found. Setup family circle to get started.'}
                  </Typography.Paragraph>
                </View>
              )}

              {/* Circle Actions (Switch/Create/Join post-onboarding) */}
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
  accordionCard: {
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  accordionCardExpanded: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
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
  chevronIcon: {
    width: 16,
    height: 16,
  },
  accordionContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.md,
  },
  accordionDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginBottom: theme.spacing.xs,
  },
  recordsList: {
    gap: theme.spacing.sm,
  },
  recordItemCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.xs,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
  },
  recordItemCardPressed: {
    backgroundColor: theme.colors.background.default,
    borderColor: theme.colors.border.default,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  recordLeft: {
    flex: 1,
    gap: 2,
  },
  recordComplaint: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  recordContext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  recordDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  arrowRightIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.text.tertiary,
  },
  aiBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: theme.radius.sm,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    gap: 4,
  },
  sparklesMini: {
    width: 10,
    height: 10,
    tintColor: theme.colors.primary.DEFAULT,
  },
  aiBadgeText: {
    fontSize: 10,
    color: theme.colors.primary.DEFAULT,
    flex: 1,
  },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyRecordsText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.fontSize.sm,
  },
  addRecordShortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  addRecordShortcutButtonPressed: {
    backgroundColor: theme.colors.border.light,
  },
  plusMini: {
    width: 12,
    height: 12,
    tintColor: theme.colors.text.primary,
  },
  addRecordShortcutText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
