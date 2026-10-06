import { Platform } from 'react-native';

/**
 * Design tokens: cool neutral surfaces, a restrained violet accent and deep ink heroes.
 * Urbanist provides display type over Plus Jakarta Sans for everything else.
 *
 * Weights are separate font families, not `fontWeight`: Android does not synthesise weights
 * for custom fonts, so asking for 600 on a 400-only family silently renders 400.
 */

export const fonts = {
  display: 'Urbanist_700Bold',
  displayMedium: 'Urbanist_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  semibold: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
};

export const colors = {
  primary: '#7054DE', primaryPressed: '#563AB9', primarySubtle: '#F2EEFF', primaryTint: '#E4DCFC', primaryText: '#563AB9',
  secondary: '#495368', background: '#F6F7FB', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#EDF0F6', ink: '#202640', inkMuted: '#BAC1D8',
  textPrimary: '#202640', textSecondary: '#495368', textMuted: '#626D82', textDisabled: '#8790A2',
  border: '#E3E7F0', borderSubtle: '#EDF0F6', borderStrong: '#CDD4E2',
  success: '#15803d', successSubtle: '#f0fdf4', warning: '#b45309', warningSubtle: '#fffbeb',
  error: '#be123c', errorSubtle: '#fef2f2', info: '#1d4ed8', infoSubtle: '#eff6ff',
};

export const theme = {
  ...colors, bg: colors.background, text: colors.textPrimary, muted: colors.textMuted,
  brand: colors.primary, brandWeak: colors.primarySubtle,
  danger: colors.error, dangerWeak: colors.errorSubtle,
  warn: colors.warning, warnWeak: colors.warningSubtle, ok: colors.success, okWeak: colors.successSubtle,
};

/** Status pill colours, keyed by tone. */
export const tones = {
  ok: { bg: '#f0fdf4', fg: '#15803d' },
  warn: { bg: '#fffbeb', fg: '#b45309' },
  danger: { bg: '#fef2f2', fg: '#be123c' },
  info: { bg: '#eff6ff', fg: '#1d4ed8' },
  muted: { bg: '#f8fafc', fg: '#475569' },
  accent: { bg: '#E4DCFC', fg: '#563AB9' },
};

export const typography = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -1 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  h3: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15.5, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 18, letterSpacing: -0.1 },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17.5 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  figure: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.9, fontVariant: ['tabular-nums'] },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { xs: 6, sm: 12, md: 18, lg: 22, xl: 28, pill: 999 };
export const motion = { fast: 180, base: 280, slow: 440 };

/** iOS soft shadow, Android elevation — setting both gives a grey box on Android. */
const ios = (opacity, shadowRadius, offsetY) => ({
  shadowColor: '#101014', shadowOpacity: opacity, shadowRadius, shadowOffset: { width: 0, height: offsetY },
});
export const shadow = {
  subtle: Platform.select({ ios: ios(0.04, 6, 2), android: { elevation: 1 }, default: {} }),
  card: Platform.select({ ios: ios(0.06, 12, 4), android: { elevation: 2 }, default: {} }),
  lift: Platform.select({ ios: ios(0.1, 20, 8), android: { elevation: 6 }, default: {} }),
  sheet: Platform.select({ ios: ios(0.16, 28, -4), android: { elevation: 16 }, default: {} }),
};
