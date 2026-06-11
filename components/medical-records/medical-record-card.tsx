import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { MedicalRecordResponse } from '@/src/features/medical-records/medicalRecordTypes';

interface MedicalRecordCardProps {
  record: MedicalRecordResponse;
  onPress: () => void;
}

export const MedicalRecordCard: React.FC<MedicalRecordCardProps> = React.memo(({ record, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recordItemCard,
        pressed ? styles.recordItemCardPressed : null,
        { borderCurve: 'continuous' }
      ]}
    >
      <View style={styles.recordRow}>
        <View style={styles.recordLeft}>
          <Typography.Paragraph style={styles.recordComplaint}>
            {record.chief_complaint || 'General Checkup'}
          </Typography.Paragraph>
          <Typography.Label style={styles.recordContext}>
            {record.primary_context || 'Location not specified'}
          </Typography.Label>
        </View>
        <View style={styles.recordRight}>
          <Typography.Label style={styles.recordDate}>
            {record.visit_date}
          </Typography.Label>
          <Image source="sf:chevron.right" style={styles.arrowRightIcon} />
        </View>
      </View>
      {record.ai_summary ? (
        <View style={styles.aiBadgeContainer}>
          <Image source="sf:sparkles" style={styles.sparklesMini} />
          <Typography.Label numberOfLines={1} style={styles.aiBadgeText}>
            {record.ai_summary}
          </Typography.Label>
        </View>
      ) : null}
    </Pressable>
  );
});

MedicalRecordCard.displayName = 'MedicalRecordCard';

const styles = StyleSheet.create({
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
});
