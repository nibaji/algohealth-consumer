import { Platform, ViewStyle } from 'react-native';

const purplePrimary = {
  DEFAULT: '#8A2BE2', // BlueViolet
  light: '#9B45E6',
  dark: '#7A1FD1',
  content: '#FFFFFF', // Text color to show on top of primary
};

const neutral = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

export const theme = {
  colors: {
    primary: purplePrimary,
    background: {
      default: neutral.white,
      surface: neutral.white,
      inverse: neutral.gray900,
      primaryLight: '#FAF5FF',
      infoLight: '#EEF2FF',
      warningLight: '#FEF3C7',
      errorLight: '#FEE2E2',
    },
    text: {
      primary: neutral.gray900,
      secondary: neutral.gray600,
      tertiary: neutral.gray400,
      inverse: neutral.white,
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      warningDark: '#D97706',
    },
    border: {
      light: neutral.gray200,
      default: neutral.gray300,
      dark: neutral.gray400,
      primaryLight: '#E9D5FF',
      warningLight: '#FDE68A',
    },
    status: {
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 56,
    '5xl': 64,
    '6xl': 80,
    '7xl': 96,
    '8xl': 112,
    '9xl': 128,
    '10xl': 144,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export const shadows: Record<string, ViewStyle> = {
  sm: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
  },
  md: {
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  lg: {
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
  },
  xl: {
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
