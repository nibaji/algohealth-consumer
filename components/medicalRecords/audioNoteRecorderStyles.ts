import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  recorderPanel: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
  },
  recorderPanelChat: {
    backgroundColor: 'transparent',
    padding: 0,
    width: '100%',
  },
  idleStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  recordMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  recordMicButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  idleTextContainer: {
    flex: 1,
    gap: 2,
  },
  audioNoteTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  audioNoteSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  recordingStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pulseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTimerContainer: {
    flex: 1,
    gap: 2,
  },
  recordingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.status.error,
    fontWeight: '600',
  },
  recordingDuration: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonPressed: {
    opacity: 0.8,
  },
  stopIconSquare: {
    width: 14,
    height: 14,
    backgroundColor: theme.colors.background.default,
    borderRadius: 2,
  },
  playerPanel: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    padding: theme.spacing.md,
  },
  playerPanelChat: {
    backgroundColor: 'transparent',
    padding: 0,
    width: '100%',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButtonPressed: {
    opacity: 0.7,
  },
  seekerContainer: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    insetBlock: theme.spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border.light,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  progressBarThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.DEFAULT,
    position: 'absolute',
    marginLeft: -6,
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  deleteAudioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAudioButtonPressed: {
    opacity: 0.7,
  },
});
