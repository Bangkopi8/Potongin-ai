export const colors = {
  // Primary brand
  forest: '#1a3d2f',
  forestDeep: '#0f2820',
  forestMid: '#2d5a42',
  forestLight: '#3d7a5a',

  // Backgrounds
  bgBase: '#f7f5f2',
  bgCard: '#ffffff',
  bgSubtle: '#f2ede8',
  bgMuted: '#ece7e1',

  // Text
  textPrimary: '#111916',
  textSecondary: '#3d4f47',
  textTertiary: '#6b7c74',
  textMuted: '#96a39d',

  // Accent
  amber: '#c96f2a',
  amberLight: '#fef3e2',
  amberBorder: '#f5d9a8',

  // Semantic
  success: '#166534',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  error: '#991b1b',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  warning: '#92400e',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  info: '#1e40af',
  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',

  // Borders
  border: '#e4ddd6',
  borderStrong: '#c8bfb5',

  // Tones for badges
  mintBg: '#ecfdf5',
  mintText: '#065f46',
  roseBg: '#fff1f2',
  roseText: '#9f1239',
  skyBg: '#eff6ff',
  skyText: '#1e3a8a',
  amberBg: '#fffbeb',
  amberText: '#78350f',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const shadow = {
  card: {
    shadowColor: '#0f2820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardStrong: {
    shadowColor: '#0f2820',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const type = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.amber,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  micro: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
};
