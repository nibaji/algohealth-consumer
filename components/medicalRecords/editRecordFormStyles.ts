import { StyleSheet } from 'react-native';
import { shadows, theme } from '@/constants/theme';

export const styles = StyleSheet.create({
  cardForm: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    ...shadows.soft,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  editAttachmentsSection: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.md,
  },
  editAttachmentsLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: theme.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editAttachButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  editAttachButtonPressed: {
    opacity: 0.6,
  },
  editAttachButtonText: {
    color: theme.colors.primary.DEFAULT,
    fontWeight: '600',
  },
  editFileList: {
    gap: theme.spacing.xs,
  },
  editFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  editFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  editFileNameContainer: {
    flex: 1,
    gap: 2,
  },
  editFileName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  editFileSize: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  editDeleteFileButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  editDeleteFileButtonPressed: {
    opacity: 0.6,
  },
  editAudioSection: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  editAudioLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: theme.colors.background.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  errorBannerText: {
    color: theme.colors.text.error,
    fontWeight: '600',
  },
});
