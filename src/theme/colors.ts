// Mobi_R mobile design tokens: the same Click-style theme as the web admin
// (bright brand blue, soft blue-grey canvas, white rounded cards).
export const colors = {
  primary: '#0B6BFF', // brand-500
  primaryDark: '#0850C0', // brand-700
  primaryLight: '#EEF5FF', // brand-50
  primaryBorder: '#BCD6FF', // brand-200
  primarySoft: '#E0ECFF', // brand-100
  secondary: '#344054', // ink-700
  accent: '#0B6BFF',

  background: '#F1F4F9', // canvas
  card: '#FFFFFF',
  surfaceSecondary: '#F0F2F6', // ink-100

  text: '#101828', // ink-900
  textSecondary: '#667085', // ink-500
  textMuted: '#98A2B3', // ink-400
  border: '#E4E7EC', // ink-200
  borderSubtle: '#F0F2F6',

  success: '#059669',
  successLight: '#ECFDF5',
  danger: '#E11D48',
  dangerLight: '#FFF1F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  violet: '#7C3AED',
  violetLight: '#F5F3FF',
  info: '#0B6BFF',
  infoLight: '#EEF5FF',

  shadow: '#101828',
  white: '#FFFFFF',
  overlay: 'rgba(16, 24, 40, 0.45)',
};

// 4-pt spacing scale
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 10,
  md: 14, // controls: buttons, inputs, chips
  lg: 22, // cards (web rounded-card)
  pill: 999,
};

export const font = {
  caption: 11,
  small: 13,
  body: 15,
  title: 17,
  h2: 20,
  h1: 26,
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pop: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
