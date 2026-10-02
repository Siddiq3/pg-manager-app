export const colors = {
  primary: '#146650', primaryPressed: '#0d4b3a', primarySubtle: '#e9f4ef',
  secondary: '#43544e', background: '#f5f7f6', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#edf1ef',
  textPrimary: '#182923', textSecondary: '#43544e', textMuted: '#61716a', textDisabled: '#8a8a95',
  border: '#dde5e1', borderSubtle: '#edf1ef', borderStrong: '#bdcbc4',
  success: '#15803d', successSubtle: '#f0fdf4', warning: '#b45309', warningSubtle: '#fffbeb',
  error: '#be123c', errorSubtle: '#fef2f2', info: '#1d4ed8', infoSubtle: '#eff6ff',
};
export const theme = {
  ...colors, bg: colors.background, text: colors.textPrimary, muted: colors.textMuted,
  brand: colors.primary, brandWeak: colors.primarySubtle,
  danger: colors.error, dangerWeak: colors.errorSubtle,
  warn: colors.warning, warnWeak: colors.warningSubtle, ok: colors.success, okWeak: colors.successSubtle,
};
export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6 },
  h2: { fontSize: 21, lineHeight: 28, fontWeight: '600', letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const motion = { fast: 180, base: 280, slow: 440 };
