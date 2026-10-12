// Mobi_R mobile design tokens. Same sky brand as the web admin.
export const colors = {
  primary: '#0284C7', // sky-600
  primaryDark: '#0369A1', // sky-700
  primaryLight: '#F0F9FF', // sky-50
  primaryBorder: '#BAE6FD', // sky-200
  secondary: '#334155', // slate-700
  accent: '#0284C7',

  background: '#F4F6F9',
  card: '#FFFFFF',
  surfaceSecondary: '#F1F5F9', // slate-100

  text: '#0F172A', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94A3B8', // slate-400
  border: '#E2E8F0', // slate-200
  borderSubtle: '#F1F5F9',

  success: '#16A34A',
  successLight: '#F0FDF4',
  danger: '#E11D48',
  dangerLight: '#FFF1F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  shadow: '#0F172A',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
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
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

export const font = {
  caption: 11,
  small: 12,
  body: 14,
  title: 16,
  h2: 19,
  h1: 24,
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
};
