import { StyleSheet } from 'react-native';

import { shadows, theme } from '@/constants/theme';

export const howToUseAppStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.primaryLight,
  },
  heroIcon: {
    width: theme.spacing['4xl'],
    height: theme.spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.surface,
    ...shadows.sm,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize['2xl'],
    lineHeight: theme.lineHeight['2xl'],
    textAlign: 'center',
  },
  heroDescription: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.surface,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepBadge: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  stepText: {
    color: theme.colors.primary.content,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.text.secondary,
  },
  bullets: {
    gap: theme.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bulletDot: {
    width: theme.spacing.xs2,
    height: theme.spacing.xs2,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  bulletText: {
    flex: 1,
    color: theme.colors.text.secondary,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.warningLight,
  },
  noteText: {
    flex: 1,
    color: theme.colors.text.warningDark,
  },
  separator: {
    height: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primaryLight,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.background.purpleLight,
  },
  footerText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});
