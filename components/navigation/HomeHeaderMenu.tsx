import React, { useCallback, useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { Icon, IconName } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { shadows, theme } from '@/constants/theme';

const MENU_ANIMATION_MS = 180;
const MENU_LAYER_INDEX = 10;
const MENU_MIN_WIDTH =
  theme.spacing['10xl'] + theme.spacing['2xl'];
const MENU_MAX_WIDTH =
  theme.spacing['10xl'] + theme.spacing['6xl'];

interface HomeHeaderMenuProps {
  visible: boolean;
  topOffset: number;
  onDismiss: () => void;
  onProfile: () => void;
  onHowToUse: () => void;
  onSettings: () => void;
}

interface MenuItemProps {
  icon: IconName;
  title: string;
  showDivider: boolean;
  onPress: () => void;
}

const MenuItem = React.memo(({
  icon,
  title,
  showDivider,
  onPress,
}: MenuItemProps): React.JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    onPress={onPress}
    style={({ pressed }) => [
      styles.menuItem,
      pressed ? styles.menuItemPressed : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      tintColor={theme.colors.primary.DEFAULT}
    />
    <Typography.Paragraph style={styles.menuItemTitle}>
      {title}
    </Typography.Paragraph>
    {showDivider ? (
      <View
        pointerEvents="none"
        style={styles.menuItemDivider}
      />
    ) : null}
  </Pressable>
));

MenuItem.displayName = 'MenuItem';

export const HomeHeaderMenu = React.memo(({
  visible,
  topOffset,
  onDismiss,
  onProfile,
  onHowToUse,
  onSettings,
}: HomeHeaderMenuProps): React.JSX.Element | null => {
  useEffect(() => {
    if (!visible || process.env.EXPO_OS === 'web') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      (): boolean => {
        onDismiss();
        return true;
      }
    );

    return (): void => {
      subscription.remove();
    };
  }, [onDismiss, visible]);

  const handleProfile = useCallback((): void => {
    onDismiss();
    onProfile();
  }, [onDismiss, onProfile]);

  const handleHowToUse = useCallback((): void => {
    onDismiss();
    onHowToUse();
  }, [onDismiss, onHowToUse]);

  const handleSettings = useCallback((): void => {
    onDismiss();
    onSettings();
  }, [onDismiss, onSettings]);

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={styles.layer}
    >
      <Pressable
        accessible={false}
        onPress={onDismiss}
        style={styles.backdrop}
      />
      <Animated.View
        accessibilityLabel="Account and app menu"
        accessibilityViewIsModal
        onAccessibilityEscape={onDismiss}
        entering={FadeInDown.duration(MENU_ANIMATION_MS)}
        exiting={FadeOut.duration(MENU_ANIMATION_MS)}
        style={[styles.menu, { top: topOffset }]}
      >
        <MenuItem
          icon={IconName.PersonCropCircleFill}
          title="Profile"
          showDivider
          onPress={handleProfile}
        />
        <MenuItem
          icon={IconName.QuestionmarkCircleFill}
          title="How to Use the App?"
          showDivider
          onPress={handleHowToUse}
        />
        <MenuItem
          icon={IconName.GearshapeFill}
          title="Settings"
          showDivider={false}
          onPress={handleSettings}
        />
      </Animated.View>
    </View>
  );
});

HomeHeaderMenu.displayName = 'HomeHeaderMenu';

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: theme.spacing.none,
    right: theme.spacing.none,
    bottom: theme.spacing.none,
    left: theme.spacing.none,
    zIndex: MENU_LAYER_INDEX,
  },
  backdrop: {
    position: 'absolute',
    top: theme.spacing.none,
    right: theme.spacing.none,
    bottom: theme.spacing.none,
    left: theme.spacing.none,
  },
  menu: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: '72%',
    minWidth: MENU_MIN_WIDTH,
    maxWidth: MENU_MAX_WIDTH,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.surface,
    ...shadows.lg,
  },
  menuItem: {
    minHeight: theme.spacing['4xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  menuItemDivider: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.none,
    left: theme.spacing.md,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.background.primaryLight,
  },
  menuItemTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
