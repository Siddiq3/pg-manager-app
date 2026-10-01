export const colors = {
  primary: '#e2511e', primaryPressed: '#b83e15', primarySubtle: '#fef1ea',
  secondary: '#45454f', background: '#f4f4f6', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#eeeef1',
  textPrimary: '#101014', textSecondary: '#45454f', textMuted: '#5b5b66', textDisabled: '#8a8a95',
  border: '#e6e6ea', borderSubtle: '#eeeef1', borderStrong: '#d3d3d9',
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
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 15.5, lineHeight: 23, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { xs: 6, sm: 12, md: 18, lg: 22, xl: 28, pill: 999 };
export const motion = { fast: 180, base: 280, slow: 440 };
