import React from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { theme, shadows } from '@/constants/theme';
import { Typography } from './Typography';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'error';
  buttons?: AlertButton[];
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = React.memo(({
  visible,
  title,
  message,
  variant = 'info',
  buttons = [],
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(320, width - theme.spacing.xl * 2);

  // Map variant to styling colors and icons
  let iconName = IconName.InfoCircleFill;
  let iconColor = theme.colors.primary.DEFAULT;
  let iconBgColor = theme.colors.background.purpleLight;

  if (variant === 'success') {
    iconName = IconName.CheckmarkCircleFill;
    iconColor = theme.colors.status.success;
    iconBgColor = theme.colors.background.successLight;
  } else if (variant === 'warning') {
    iconName = IconName.ExclamationmarkTriangleFill;
    iconColor = theme.colors.status.warning;
    iconBgColor = theme.colors.background.warningLight;
  } else if (variant === 'danger') {
    iconName = IconName.XmarkCircleFill;
    iconColor = theme.colors.status.error;
    iconBgColor = theme.colors.background.errorLight;
  } else if (variant === 'error') {
    iconName = IconName.ExclamationmarkCircleFill;
    iconColor = theme.colors.status.error;
    iconBgColor = theme.colors.background.errorLight;
  }

  // If no buttons are specified, default to an "OK" button
  const renderedButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: cardWidth, borderCurve: 'continuous' }]}>
          {/* Header Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
            <Icon name={iconName} size={28} tintColor={iconColor} />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Typography.Subheading style={styles.title} truncate={false}>
              {title}
            </Typography.Subheading>
            <Typography.Label style={styles.message} truncate={false}>
              {message}
            </Typography.Label>
          </View>

          {/* Action Row */}
          <View style={styles.buttonRow}>
            {renderedButtons.map((btn, idx) => {
              const handlePress = () => {
                onClose();
                if (btn.onPress) {
                  btn.onPress();
                }
              };

              if (btn.style === 'destructive') {
                return (
                  <Button.Error
                    key={idx}
                    title={btn.text}
                    onPress={handlePress}
                    style={styles.flexButton}
                  />
                );
              } else if (btn.style === 'cancel') {
                return (
                  <Button.Secondary
                    key={idx}
                    title={btn.text}
                    onPress={handlePress}
                    style={styles.flexButton}
                  />
                );
              } else {
                return (
                  <Button.Primary
                    key={idx}
                    title={btn.text}
                    onPress={handlePress}
                    style={styles.flexButton}
                  />
                );
              }
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
});

AlertModal.displayName = 'AlertModal';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.translucent.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...shadows.lg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -theme.spacing.xs,
  },
  textContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeight.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
    marginTop: theme.spacing.xs,
  },
  flexButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
});
