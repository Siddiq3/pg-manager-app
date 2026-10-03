export const colors = {
  primary: '#156b5d', primaryPressed: '#0f554a', primarySubtle: '#eaf5f2',
  secondary: '#52635d', background: '#f6f7f5', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#eef2ef',
  textPrimary: '#1d2622', textSecondary: '#4f5e58', textMuted: '#6f7d77', textDisabled: '#99a39f',
  border: '#dfe6e2', borderSubtle: '#edf1ef', borderStrong: '#cbd5d0',
  success: '#16734b', successSubtle: '#edf8f2', warning: '#9a6108', warningSubtle: '#fff7e8',
  error: '#b4233b', errorSubtle: '#fff0f2', info: '#28649a', infoSubtle: '#edf5fb',
};
export const theme = {
  ...colors, bg: colors.background, text: colors.textPrimary, muted: colors.textMuted,
  brand: colors.primary, brandWeak: colors.primarySubtle,
  danger: colors.error, dangerWeak: colors.errorSubtle,
  warn: colors.warning, warnWeak: colors.warningSubtle, ok: colors.success, okWeak: colors.successSubtle,
};
export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 },
  h1: { fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 20, lineHeight: 27, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { xs: 5, sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };
export const motion = { fast: 180, base: 280, slow: 440 };
