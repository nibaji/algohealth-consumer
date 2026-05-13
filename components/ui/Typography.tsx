import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme, Fonts } from '@/constants/theme';

export interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

const Heading = ({ style, ...props }: TypographyProps) => (
  <Text style={[styles.heading, style]} {...props} />
);

const Subheading = ({ style, ...props }: TypographyProps) => (
  <Text style={[styles.subheading, style]} {...props} />
);

const Paragraph = ({ style, ...props }: TypographyProps) => (
  <Text style={[styles.paragraph, style]} {...props} />
);

const Label = ({ style, ...props }: TypographyProps) => (
  <Text style={[styles.label, style]} {...props} />
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
