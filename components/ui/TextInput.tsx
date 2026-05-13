import React, { useState } from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps, 
  StyleSheet, 
  View, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { theme, Fonts } from '@/constants/theme';
import { Typography } from './Typography';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextInput = ({ 
  label, 
  error, 
  containerStyle, 
  style, 
  ...props 
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Typography.Label style={styles.label}>
          {label}
        </Typography.Label>
      ) : null}
      
      <RNTextInput
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      
      {error ? (
        <Typography.Label style={styles.errorText}>
          {error}
        </Typography.Label>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: theme.colors.primary.DEFAULT,
  },
  inputError: {
    borderColor: theme.colors.status.error,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
});
