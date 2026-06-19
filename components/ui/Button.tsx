import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/constants/theme';
import { Typography } from './Typography';
import { Icon, IconName } from './Icon';

export interface BaseButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconName?: IconName;
  iconSize?: number;
  iconColor?: string;
  iconPosition?: 'left' | 'right';
}

const BaseButton = ({ 
  title, 
  loading, 
  style, 
  textStyle, 
  disabled, 
  iconName,
  iconSize = 16,
  iconColor,
  iconPosition = 'left',
  ...props 
}: BaseButtonProps & { 
  defaultStyle: ViewStyle; 
  pressedStyle: ViewStyle; 
  defaultTextStyle: TextStyle; 
}) => {
  const renderIcon = () => {
    if (!iconName) return null;
    const resolvedColor = iconColor || (props.defaultTextStyle.color as string);
    return (
      <Icon
        name={iconName}
        size={iconSize}
        tintColor={resolvedColor}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        props.defaultStyle,
        pressed ? props.pressedStyle : null,
        (disabled || loading) ? styles.disabled : null,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={props.defaultTextStyle.color as string} />
      ) : (
        <>
          {iconPosition === 'left' ? renderIcon() : null}
          <Typography.Label style={[props.defaultTextStyle, textStyle]}>
            {title}
          </Typography.Label>
          {iconPosition === 'right' ? renderIcon() : null}
        </>
      )}
    </Pressable>
  );
};

const Primary = (props: BaseButtonProps) => (
  <BaseButton
    {...props}
    defaultStyle={styles.primaryBase}
    pressedStyle={styles.primaryPressed}
    defaultTextStyle={styles.primaryText}
  />
);

const Secondary = (props: BaseButtonProps) => (
  <BaseButton
    {...props}
    defaultStyle={styles.secondaryBase}
    pressedStyle={styles.secondaryPressed}
    defaultTextStyle={styles.secondaryText}
  />
);

const Error = (props: BaseButtonProps) => (
  <BaseButton
    {...props}
    defaultStyle={styles.errorBase}
    pressedStyle={styles.errorPressed}
    defaultTextStyle={styles.errorText}
  />
);

export const Button = {
  Primary,
  Secondary,
  Error,
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Primary
  primaryBase: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  primaryPressed: {
    backgroundColor: theme.colors.primary.dark,
  },
  primaryText: {
    color: theme.colors.primary.content,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
  
  // Secondary
  secondaryBase: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  secondaryPressed: {
    backgroundColor: theme.colors.background.default,
  },
  secondaryText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
  
  // Error
  errorBase: {
    backgroundColor: theme.colors.status.error,
  },
  errorPressed: {
    backgroundColor: '#DC2626', // slightly darker red
  },
  errorText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
});
