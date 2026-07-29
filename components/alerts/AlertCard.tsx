import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { AlertType } from '@/src/features/alerts/alertTypes';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface AlertCardProps {
  title: string;
  message: string;
  type: AlertType;
  createdAt: string;
  isRead: boolean;
}

interface AlertVisual {
  icon: IconName;
  color: string;
  iconContainerStyle: StyleProp<ViewStyle>;
}

const getAlertVisual = (type: AlertType): AlertVisual => {
  switch (type) {
    case 'CLINICAL':
      return {
        icon: IconName.ExclamationmarkCircleFill,
        color: theme.colors.status.error,
        iconContainerStyle: styles.clinicalIcon,
      };
    case 'REMINDER':
      return {
        icon: IconName.BellFill,
        color: theme.colors.status.warning,
        iconContainerStyle: styles.reminderIcon,
      };
    case 'SYSTEM':
      return {
        icon: IconName.InfoCircleFill,
        color: theme.colors.status.info,
        iconContainerStyle: styles.systemIcon,
      };
  }
};

const alertDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatAlertDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return alertDateFormatter.format(date);
};

export const AlertCard = React.memo(({
  title,
  message,
  type,
  createdAt,
  isRead,
}: AlertCardProps): React.JSX.Element => {
  const visual = getAlertVisual(type);

  return (
    <View style={[styles.card, isRead ? null : styles.unreadCard]}>
      <View
        style={[
          styles.iconContainer,
          visual.iconContainerStyle,
        ]}
      >
        <Icon
          name={visual.icon}
          size={20}
          tintColor={visual.color}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Typography.Paragraph selectable style={styles.title}>
            {title}
          </Typography.Paragraph>
          {isRead ? null : <View style={styles.unreadDot} />}
        </View>

        <Typography.Paragraph selectable style={styles.message}>
          {message}
        </Typography.Paragraph>

        <View style={styles.metaRow}>
          <Typography.Label style={[styles.type, { color: visual.color }]}>
            {type}
          </Typography.Label>
          <Typography.Label selectable style={styles.timestamp}>
            {formatAlertDate(createdAt)}
          </Typography.Label>
        </View>
      </View>
    </View>
  );
});

AlertCard.displayName = 'AlertCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  unreadCard: {
    backgroundColor: theme.colors.background.primaryLight,
  },
  iconContainer: {
    width: theme.spacing['2xl'],
    height: theme.spacing['2xl'],
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicalIcon: {
    backgroundColor: theme.colors.background.errorLight,
  },
  reminderIcon: {
    backgroundColor: theme.colors.background.warningLight,
  },
  systemIcon: {
    backgroundColor: theme.colors.background.infoLight,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  unreadDot: {
    width: theme.spacing.xs2,
    height: theme.spacing.xs2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  message: {
    color: theme.colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  type: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  timestamp: {
    flex: 1,
    color: theme.colors.text.tertiary,
    fontSize: theme.fontSize.xs,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
