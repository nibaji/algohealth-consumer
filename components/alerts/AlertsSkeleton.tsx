import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { theme } from '@/constants/theme';

const ALERT_SKELETON_ITEMS = [1, 2, 3, 4, 5] as const;

export const AlertsSkeleton = (): React.JSX.Element => (
  <View
    accessible
    accessibilityLabel="Loading alerts"
    style={styles.container}
  >
    {ALERT_SKELETON_ITEMS.map((item) => (
      <React.Fragment key={item}>
        <View style={styles.alertRow}>
          <Skeleton
            width={theme.spacing['2xl']}
            height={theme.spacing['2xl']}
            borderRadius={theme.radius.md}
          />

          <View style={styles.content}>
            <Skeleton width="55%" height={theme.spacing.md} />
            <View style={styles.message}>
              <Skeleton width="92%" height={theme.fontSize.sm} />
              <Skeleton width="72%" height={theme.fontSize.sm} />
            </View>
            <View style={styles.metaRow}>
              <Skeleton width="20%" height={theme.fontSize.xs} />
              <Skeleton width="34%" height={theme.fontSize.xs} />
            </View>
          </View>
        </View>
        {item === ALERT_SKELETON_ITEMS.at(-1) ? null : (
          <View style={styles.separator} />
        )}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  message: {
    gap: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.xxs,
    backgroundColor: theme.colors.border.light,
  },
});
