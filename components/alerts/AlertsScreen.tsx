import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertsSkeleton } from '@/components/alerts/AlertsSkeleton';
import { Button } from '@/components/ui/Button';
import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { AlertItem } from '@/src/features/alerts/alertTypes';
import { useAlerts } from '@/src/features/alerts/useAlerts';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export const AlertsScreen = (): React.JSX.Element => {
  const {
    alerts,
    isLoading,
    isRefreshing,
    error,
    readWarning,
    refresh,
    retry,
  } = useAlerts();

  const renderAlert = useCallback(
    ({ item }: { item: AlertItem }): React.JSX.Element => (
      <AlertCard
        title={item.title}
        message={item.message}
        type={item.type}
        createdAt={item.created_at}
        isRead={item.is_read}
      />
    ),
    []
  );
  const keyExtractor = useCallback((item: AlertItem): string => item.id, []);

  if (isLoading) {
    return <AlertsSkeleton />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Icon
          name={IconName.ExclamationmarkCircleFill}
          size={theme.spacing['2xl']}
          tintColor={theme.colors.status.error}
        />
        <Typography.Paragraph selectable style={styles.errorText}>
          {error}
        </Typography.Paragraph>
        <Button.Secondary title="Try Again" onPress={retry} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <FlashList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={AlertSeparator}
        ListHeaderComponent={
          readWarning ? <ReadWarning message={readWarning} /> : null
        }
        ListEmptyComponent={<EmptyAlerts />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary.DEFAULT}
            colors={[theme.colors.primary.DEFAULT]}
          />
        }
      />
    </Animated.View>
  );
};

const AlertSeparator = (): React.JSX.Element => (
  <View style={styles.separator} />
);

const ReadWarning = ({ message }: { message: string }): React.JSX.Element => (
  <View style={styles.warning}>
    <Icon
      name={IconName.ExclamationmarkTriangleFill}
      size={20}
      tintColor={theme.colors.status.warning}
    />
    <Typography.Label selectable style={styles.warningText}>
      {message}
    </Typography.Label>
  </View>
);

const EmptyAlerts = (): React.JSX.Element => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Icon
        name={IconName.BellFill}
        size={theme.spacing.xl}
        tintColor={theme.colors.primary.DEFAULT}
      />
    </View>
    <Typography.Subheading style={styles.emptyTitle}>
      No alerts yet
    </Typography.Subheading>
    <Typography.Paragraph style={styles.emptyText}>
      Clinical, reminder, and system alerts will appear here.
    </Typography.Paragraph>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    paddingVertical: theme.spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.default,
  },
  errorText: {
    color: theme.colors.text.error,
    textAlign: 'center',
  },
  separator: {
    height: theme.spacing.xxs,
    backgroundColor: theme.colors.border.light,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warningLight,
  },
  warningText: {
    flex: 1,
    color: theme.colors.text.warningDark,
  },
  empty: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing['3xl'],
  },
  emptyIcon: {
    width: theme.spacing['4xl'],
    height: theme.spacing['4xl'],
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.purpleLight,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
