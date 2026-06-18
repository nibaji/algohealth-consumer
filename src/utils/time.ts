/**
 * time.ts
 *
 * Centralized pure functions for time formatting and helper calculations.
 */

/**
 * Formats a duration in seconds to MM:SS string.
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Formats a duration in milliseconds to MM:SS string.
 */
export const formatDuration = (millis: number): string => {
  const totalSeconds = millis / 1000;
  return formatTime(totalSeconds);
};
