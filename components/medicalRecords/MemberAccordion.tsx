import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnUI } from 'react-native-reanimated';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { MedicalRecordResponse } from '@/src/features/medicalRecords/medicalRecordTypes';
import { MedicalRecordCard } from './MedicalRecordCard';
import { useAuth } from '@/src/contexts/AuthContext';
import { getDisplayRelation } from '@/src/utils/relation';
import { Button } from '@/components/ui/Button';

interface MemberAccordionProps {
  member: FamilyMemberOut;
  records: MedicalRecordResponse[];
  isExpanded: boolean;
  onToggleExpand: (memberId: string) => void;
  onNavigateCreateRecord: (memberId: string) => void;
  onNavigateRecordDetails: (recordId: string) => void;
  onConsult: (member: FamilyMemberOut) => void;
  onAsk: (member: FamilyMemberOut) => void;
  onEditMember: (member: FamilyMemberOut) => void;
}

export const MemberAccordion: React.FC<MemberAccordionProps> = React.memo(({
  member,
  records,
  isExpanded,
  onToggleExpand,
  onNavigateCreateRecord,
  onNavigateRecordDetails,
  onConsult,
  onAsk,
  onEditMember,
}) => {
  const { user } = useAuth();
  // All measurement and animation state lives as shared values on the UI thread.
  // This avoids JS→bridge round-trips during animation, eliminating proportional glitching.
  const measuredHeight = useSharedValue<number>(0);
  const isExpandedSV = useSharedValue<boolean>(isExpanded);
  const height = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(0);

  // Sync the JS-side isExpanded prop into the shared value and drive animations.
  React.useEffect(() => {
    isExpandedSV.value = isExpanded;
    runOnUI(() => {
      'worklet';
      const isMeasuring = isExpanded && measuredHeight.value === 0;
      if (isMeasuring) {
        height.value = 0;
        opacity.value = 0;
      } else {
        height.value = withTiming(isExpanded ? measuredHeight.value : 0, {
          duration: 250,
          easing: Easing.out(Easing.quad),
        });
        opacity.value = withTiming(isExpanded ? 1 : 0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    })();
  }, [isExpanded, isExpandedSV, measuredHeight, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const isMeasuring = isExpandedSV.value && measuredHeight.value === 0;
    return {
      height: isMeasuring ? undefined : height.value,
      opacity: isMeasuring ? 0 : opacity.value,
      overflow: 'hidden',
    };
  });

  const innerAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Always pin inner content to the measured height once known.
    // This prevents Yoga from propagating the natural child height up through the
    // clipping outer Animated.View, which would cause the card to jump to full
    // size before withTiming can animate it open. Only fall back to undefined
    // when measuredHeight = 0 (i.e., the first measurement pass is still in progress).
    return {
      height: measuredHeight.value > 0 ? measuredHeight.value : undefined,
    };
  });

  const handleToggleExpand = React.useCallback((): void => {
    onToggleExpand(member.id);
  }, [onToggleExpand, member.id]);

  const handleConsult = React.useCallback((): void => {
    onConsult(member);
  }, [onConsult, member]);

  const handleAsk = React.useCallback((): void => {
    onAsk(member);
  }, [onAsk, member]);

  const handleNavigateCreateRecord = React.useCallback((): void => {
    onNavigateCreateRecord(member.id);
  }, [onNavigateCreateRecord, member.id]);

  const handleEditMember = React.useCallback((): void => {
    onEditMember(member);
  }, [onEditMember, member]);

  return (
    <View 
      style={[
        styles.accordionCard, 
        isExpanded ? styles.accordionCardExpanded : null,
        { borderCurve: 'continuous' }
      ]}
    >
      {/* Accordion Header */}
      <View style={styles.accordionHeader}>
        <Pressable 
          onPress={member.invite_status === 'pending' ? undefined : handleToggleExpand}
          style={styles.headerPressable}
          disabled={member.invite_status === 'pending'}
        >
          <View style={styles.avatar}>
            <Typography.Label style={styles.avatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Typography.Label>
          </View>
          <View style={styles.memberInfo}>
            <Typography.Paragraph 
              style={styles.memberName}
              truncate
            >
              {member.name}
            </Typography.Paragraph>
            <Typography.Label 
              style={styles.memberRelation}
              truncate
            >
              {getDisplayRelation(member, user)}
            </Typography.Label>
            {member.invite_status !== 'pending' ? (
              <Typography.Label 
                style={styles.memberRecordsCount}
                truncate
              >
                {`${records.length} ${records.length === 1 ? 'Record' : 'Records'}`}
              </Typography.Label>
            ) : null}
          </View>
        </Pressable>

        {member.invite_status === 'pending' ? (
          <View style={[styles.pendingTagRight, { borderCurve: 'continuous' }]}>
            <Typography.Label style={styles.pendingTagText}>
              Pending
            </Typography.Label>
          </View>
        ) : (
          <View style={styles.chatActions}>
            <Button.Secondary
              title="Consult"
              onPress={handleConsult}
              iconName={IconName.Sparkles}
              iconSize={12}
              iconColor={theme.colors.primary.DEFAULT}
              style={styles.consultButton}
              textStyle={styles.consultText}
            />
            <Button.Secondary
              title="Ask"
              onPress={handleAsk}
              iconName={IconName.PaperplaneFill}
              iconSize={12}
              iconColor={theme.colors.primary.DEFAULT}
              style={styles.consultButton}
              textStyle={styles.consultText}
            />
          </View>
        )}

        {/* Edit button next to accordion expand/close icon. Present for all members, including pending */}
        <Pressable 
          onPress={handleEditMember}
          style={({ pressed }) => [
            styles.editChevronButton,
            pressed ? styles.editChevronButtonPressed : null
          ]}
          accessibilityLabel="Edit member"
        >
          <Icon 
            name={IconName.Pencil} 
            size={16}
            tintColor={theme.colors.primary.DEFAULT}
          />
        </Pressable>

        {member.invite_status !== 'pending' ? (
          <Pressable 
            onPress={handleToggleExpand}
            style={({ pressed }) => [
              styles.chevronPressable,
              pressed ? styles.chevronPressablePressed : null
            ]}
          >
            <Icon 
              name={isExpanded ? IconName.ChevronUp : IconName.ChevronDown} 
              size={16}
              tintColor={theme.colors.text.tertiary}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Accordion Content */}
      <Animated.View style={animatedStyle} pointerEvents={isExpanded ? 'auto' : 'none'}>
      <Animated.View style={innerAnimatedStyle}>
        <View 
          onLayout={(e) => {
            const currentHeight = e.nativeEvent.layout.height;
            if (currentHeight > 0) {
              runOnUI((h: number) => {
                'worklet';
                if (Math.abs(measuredHeight.value - h) > 0.5) {
                  measuredHeight.value = h;
                  // Re-trigger height animation now that we have the measurement.
                  if (isExpandedSV.value) {
                    height.value = withTiming(h, {
                      duration: 250,
                      easing: Easing.out(Easing.quad),
                    });
                    opacity.value = withTiming(1, {
                      duration: 200,
                      easing: Easing.out(Easing.quad),
                    });
                  }
                }
              })(currentHeight);
            }
          }}
          style={styles.accordionContent}
        >
          <View style={styles.accordionDivider} />
          
          {member.health_summary ? (
            <View style={[styles.summaryCard, { borderCurve: 'continuous' }]}>
              <View style={styles.summaryTitleRow}>
                <Icon name={IconName.Sparkles} size={14} tintColor={theme.colors.primary.DEFAULT} />
                <Typography.Label style={styles.summaryTitle}>AI Health Summary</Typography.Label>
              </View>
              <Typography.Paragraph style={styles.summaryText}>
                {member.health_summary}
              </Typography.Paragraph>
            </View>
          ) : null}

          <View style={styles.sectionTitleContainer}>
            <Typography.Label style={styles.sectionTitle}>Medical Records</Typography.Label>
          </View>

          <Button.Secondary
            title="Add Medical Record"
            onPress={handleNavigateCreateRecord}
            iconName={IconName.Plus}
            iconColor={theme.colors.text.primary}
            style={styles.addRecordTopButton}
            textStyle={styles.addRecordTopText}
          />
          
          {records.length > 0 ? (
            <View style={styles.recordsList}>
              {records.map((recordItem) => (
                <MedicalRecordCard
                  key={recordItem.id}
                  record={recordItem}
                  onPress={() => onNavigateRecordDetails(recordItem.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecords}>
              <Typography.Paragraph style={styles.emptyRecordsText}>
                No medical records logged yet.
              </Typography.Paragraph>
            </View>
          )}
        </View>
      </Animated.View>
      </Animated.View>
    </View>
  );
});

MemberAccordion.displayName = 'MemberAccordion';

const styles = StyleSheet.create({
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
    gap: theme.spacing.sm,
  },
  headerPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  consultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  consultButtonPressed: {
    backgroundColor: theme.colors.border.light,
  },
  consultText: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
  },
  consultIcon: {
    width: 12,
    height: 12,
    tintColor: theme.colors.primary.DEFAULT,
  },
  chevronPressable: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronPressablePressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.infoLight,
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
  memberRecordsCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
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
  sectionTitleContainer: {
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordsList: {
    gap: theme.spacing.sm,
  },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyRecordsText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.fontSize.sm,
  },
  addRecordTopButton: {
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
    marginBottom: theme.spacing.xs,
    width: '100%',
  },
  addRecordTopText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  editChevronButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editChevronButtonPressed: {
    opacity: 0.6,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  memberSummary: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  pendingTagRight: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.border.warningLight,
    marginRight: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTagText: {
    color: theme.colors.text.warningDark,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
