import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme, Fonts } from '@/constants/theme';

export interface TypographyProps extends TextProps {
  children: React.ReactNode;
  truncate?: boolean;
}

const Heading = ({ style, truncate, ...props }: TypographyProps) => (
  <Text 
    style={[styles.heading, style]} 
    numberOfLines={truncate ? 1 : undefined}
    ellipsizeMode={truncate ? 'tail' : undefined}
    {...props} 
  />
);

const Subheading = ({ style, truncate, ...props }: TypographyProps) => (
  <Text 
    style={[styles.subheading, style]} 
    numberOfLines={truncate ? 1 : undefined}
    ellipsizeMode={truncate ? 'tail' : undefined}
    {...props} 
  />
);

const Paragraph = ({ style, truncate, ...props }: TypographyProps) => (
  <Text 
    style={[styles.paragraph, style]} 
    numberOfLines={truncate ? 1 : undefined}
    ellipsizeMode={truncate ? 'tail' : undefined}
    {...props} 
  />
);

const Label = ({ style, truncate, ...props }: TypographyProps) => (
  <Text 
    style={[styles.label, style]} 
    numberOfLines={truncate ? 1 : undefined}
    ellipsizeMode={truncate ? 'tail' : undefined}
    {...props} 
  />
);

export const Typography = {
  Heading,
  Subheading,
  Paragraph,
  Label,
};

const styles = StyleSheet.create({
  heading: {
    fontFamily: Fonts.sans,
    fontSize: theme.fontSize['3xl'],
    lineHeight: theme.lineHeight['3xl'],
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subheading: {
    fontFamily: Fonts.sans,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  paragraph: {
    fontFamily: Fonts.sans,
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
    color: theme.colors.text.primary,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
});
