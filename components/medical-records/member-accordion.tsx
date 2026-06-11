import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';
import { MedicalRecordCard } from './medical-record-card';

interface MemberAccordionProps {
  member: FamilyMemberOut;
  records: MedicalRecordResponse[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigateCreateRecord: () => void;
  onNavigateRecordDetails: (recordId: string) => void;
  onConsult: () => void;
}

export const MemberAccordion: React.FC<MemberAccordionProps> = React.memo(({
  member,
  records,
  isExpanded,
  onToggleExpand,
  onNavigateCreateRecord,
  onNavigateRecordDetails,
  onConsult,
}) => {
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
          onPress={onToggleExpand}
          style={styles.headerPressable}
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
              {member.relation} • {records.length} {records.length === 1 ? 'Record' : 'Records'}
            </Typography.Label>
          </View>
        </Pressable>

        <Pressable
          onPress={onConsult}
          style={({ pressed }) => [
            styles.consultButton,
            pressed ? styles.consultButtonPressed : null,
            { borderCurve: 'continuous' }
          ]}
        >
          <Image source="sf:sparkles" style={styles.consultIcon} />
          <Typography.Label style={styles.consultText}>
            Consult
          </Typography.Label>
        </Pressable>

        <Pressable 
          onPress={onToggleExpand}
          style={({ pressed }) => [
            styles.chevronPressable,
            pressed ? styles.chevronPressablePressed : null
          ]}
        >
          <Image 
            source={isExpanded ? "sf:chevron.up" : "sf:chevron.down"} 
            style={[styles.chevronIcon, { tintColor: theme.colors.text.tertiary }]} 
          />
        </Pressable>
      </View>

      {/* Accordion Content */}
      {isExpanded ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.accordionContent}>
          <View style={styles.accordionDivider} />
          
          <View style={styles.sectionTitleContainer}>
            <Typography.Label style={styles.sectionTitle}>Medical Records</Typography.Label>
          </View>
          
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

          {/* Add record for this member shortcut */}
          <Pressable
            onPress={onNavigateCreateRecord}
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
    marginRight: theme.spacing.xs,
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
});
