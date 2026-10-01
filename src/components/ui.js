import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonScreen } from './Skeleton';

export const colors = {
  primary: '#e2511e', primaryPressed: '#b83e15', primarySubtle: '#fef1ea',
  secondary: '#45454f', background: '#f4f4f6', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#eeeef1',
  textPrimary: '#101014', textSecondary: '#45454f', textMuted: '#5b5b66', textDisabled: '#8a8a95',
  border: '#e6e6ea', borderSubtle: '#eeeeF1', borderStrong: '#d3d3d9',
  success: '#15803d', successSubtle: '#f0fdf4', warning: '#b45309', warningSubtle: '#fffbeb',
  error: '#be123c', errorSubtle: '#fef2f2', info: '#1d4ed8', infoSubtle: '#eff6ff',
};
// Existing screen aliases preserve the component API without duplicating token values.
export const theme = {
  ...colors, bg: colors.background, text: colors.textPrimary, muted: colors.textMuted,
  brand: colors.primary, brandWeak: colors.primarySubtle,
  danger: colors.error, dangerWeak: colors.errorSubtle,
  warn: colors.warning, warnWeak: colors.warningSubtle, ok: colors.success, okWeak: colors.successSubtle,
};

// Native system fonts support the user's language and Dynamic Type without a font-loading gate.
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

/** Respect the OS setting before enabling navigation motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

/** Compact selection controls share the web app's quiet segmented treatment. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <View accessibilityLabel={label} style={styles.segmented}>
      {options.map((option) => (
        <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [styles.segment, value === option.value && styles.segmentSelected, pressed && styles.pressed]}>
          <Text style={[styles.segmentText, value === option.value && { color: theme.primary }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Screen chrome: safe-area insets (notch/home bar) plus the standard padding. */
export function Screen({ children, scroll = false, refreshControl }) {
  if (!scroll) return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>{children}</SafeAreaView>;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screenPlain}>
      <ScrollView contentContainerStyle={styles.scrollBody} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({ children, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      onPress={blocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' && styles.ghostButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'tertiary' && styles.tertiaryButton,
        variant === 'danger' && styles.dangerButton,
        pressed && !blocked && styles.pressed,
        pressed && !blocked && variant === 'primary' && { backgroundColor: theme.primaryPressed },
        blocked && styles.disabledButton,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={blocked ? theme.textDisabled : variant === 'primary' ? '#fff' : theme.brand} />}
      <Text style={[styles.buttonText, variant !== 'primary' && styles.ghostText, variant === 'secondary' && { color: theme.textSecondary }, variant === 'danger' && styles.dangerText, blocked && { color: theme.textDisabled }]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, error, autoCapitalize = 'none', ...rest }) {
  const [focused, setFocused] = useState(false);
  const { onFocus, onBlur, style: inputStyle, ...inputProps } = rest;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder || label}
        placeholderTextColor={theme.textDisabled}
        accessibilityLabel={label}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, focused && styles.inputFocused, inputProps.editable === false && styles.inputDisabled, !!error && styles.inputError, inputStyle]}
        autoCapitalize={autoCapitalize}
        {...inputProps}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function Stat({ label, value, hint, tone = 'default' }) {
  return (
    <View style={[styles.stat, tone !== 'default' && { borderTopColor: theme[tone], borderTopWidth: 2 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  );
}

const BADGE_TONES = { PAID: 'ok', ACTIVE: 'ok', VACANT: 'ok', PARTIAL: 'warn', PENDING: 'warn', OVERDUE: 'danger', VACATED: 'muted', OCCUPIED: 'info', AVAILABLE: 'ok', INACTIVE: 'muted', COMPLETED: 'ok', CANCELLED: 'muted' };

export function Badge({ children }) {
  const tone = BADGE_TONES[children] || 'muted';
  const colors = {
    ok: [theme.okWeak, theme.ok],
    warn: [theme.warnWeak, theme.warn],
    danger: [theme.dangerWeak, theme.danger],
    muted: [theme.surfaceMuted, theme.muted],
    info: [theme.infoSubtle, theme.info],
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors[0] }]}>
      <Text style={[styles.badgeText, { color: colors[1] }]}>{children}</Text>
    </View>
  );
}

export function Row({ title, subtitle, right, badge, onPress }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {badge ? <Badge>{badge}</Badge> : null}
      {!!right && <Text style={styles.rowRight}>{right}</Text>}
    </Pressable>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {action}
    </View>
  );
}

/** Consistent loading / offline / timeout / server / empty states for every query. */
export function QueryState({ query, empty, children }) {
  if (query.isLoading) return <SkeletonScreen rows={4} />;
  if (query.isError) {
    const kind = query.error?.uiKind;
    const title = kind === 'network' ? 'You’re offline'
      : kind === 'timeout' ? 'This is taking too long'
      : kind === 'server' ? 'Server unavailable'
      : kind === 'rate' ? 'Please wait a moment'
      : 'Couldn’t load this';
    const message = query.error?.uiMessage || query.error?.response?.data?.message || 'Something went wrong while loading this screen.';
    return <StateView title={title} message={message} actionLabel="Try again" onAction={() => query.refetch()} tone="error" />;
  }
  if (empty && !(query.data || []).length) return <StateView title="Nothing here yet" message={empty} />;
  return children;
}

export function StateView({ title, message, actionLabel, onAction, tone = 'neutral' }) {
  const error = tone === 'error';
  return (
    <View style={[styles.stateView, error && styles.stateError]}>
      <View style={[styles.stateIcon, error && { backgroundColor: theme.dangerWeak }]}><Text style={{ fontSize: 20 }}>{error ? '!' : '·'}</Text></View>
      <Text style={styles.stateTitle}>{title}</Text>
      {!!message && <Text style={styles.stateMessage}>{message}</Text>}
      {!!actionLabel && <Button variant={error ? 'ghost' : 'secondary'} onPress={onAction}>{actionLabel}</Button>}
    </View>
  );
}

export const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', padding: 4, gap: 4, backgroundColor: theme.surfaceMuted, borderRadius: 10 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 7 },
  segmentSelected: { backgroundColor: theme.surface },
  segmentText: { ...typography.small, color: theme.textSecondary, fontWeight: '600' },
  screen: { flex: 1, backgroundColor: theme.bg, padding: 20, gap: 16 },
  screenPlain: { flex: 1, backgroundColor: theme.bg },
  scrollBody: { padding: 20, gap: 16, paddingBottom: 40 },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: theme.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostButton: { backgroundColor: theme.brandWeak },
  secondaryButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderStrong },
  tertiaryButton: { backgroundColor: 'transparent' },
  dangerButton: { backgroundColor: theme.dangerWeak },
  pressed: { opacity: 0.8 },
  disabledButton: { backgroundColor: theme.surfaceMuted, borderColor: theme.borderSubtle },
  buttonText: { ...typography.small, color: '#fff', fontWeight: '600', textAlign: 'center' },
  ghostText: { color: theme.brand },
  dangerText: { color: theme.danger },
  field: { gap: 6 },
  label: { ...typography.label, color: theme.textSecondary },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: 10,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    color: theme.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputFocused: { borderColor: theme.primary, backgroundColor: theme.primarySubtle },
  inputDisabled: { backgroundColor: theme.surfaceMuted, color: theme.textDisabled },
  inputError: { borderColor: theme.danger },
  errorText: { color: theme.danger, fontSize: 12 },
  stat: {
    flex: 1,
    minHeight: 108,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 16,
    gap: 6,
    justifyContent: 'center',
  },
  statLabel: { color: theme.muted, fontWeight: '600', fontSize: 12 },
  statValue: { color: theme.text, fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statHint: { ...typography.caption, color: theme.muted },
  row: {
    minHeight: 76,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: { ...typography.body, color: theme.text, fontWeight: '600' },
  rowSubtitle: { ...typography.small, marginTop: 4, color: theme.muted },
  rowRight: { ...typography.small, color: theme.brand, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  sectionTitleText: { ...typography.h3, color: theme.text, flexShrink: 1 },
  empty: { ...typography.small, color: theme.muted, paddingVertical: 16 },
  emptyState: { padding: 20, backgroundColor: theme.surfaceMuted, borderRadius: 10 },
  notice: { backgroundColor: theme.dangerWeak, borderRadius: 12, padding: 14, gap: 10 },
  noticeText: { color: theme.danger },
  stateView: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.borderSubtle },
  stateError: { backgroundColor: theme.dangerWeak, borderColor: theme.border },
  stateIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceMuted },
  stateTitle: { ...typography.h3, color: theme.text, textAlign: 'center' },
  stateMessage: { ...typography.small, color: theme.muted, textAlign: 'center', maxWidth: 320 },
});
