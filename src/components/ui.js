import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  primary: '#176b70', primaryPressed: '#105257', primarySubtle: '#e8f3f3',
  secondary: '#465c72', background: '#f5f7f9', surface: '#ffffff',
  surfaceElevated: '#ffffff', surfaceMuted: '#eef2f5',
  textPrimary: '#1b2a36', textSecondary: '#526370', textMuted: '#5c6d7a', textDisabled: '#7f8d98',
  border: '#dce4e9', borderSubtle: '#eaf0f3', borderStrong: '#8294a1',
  success: '#26704e', successSubtle: '#edf6f0', warning: '#8a5b16', warningSubtle: '#fbf3e5',
  error: '#ad3e3e', errorSubtle: '#fbeeee', info: '#365f91', infoSubtle: '#edf3fb',
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
  display: { fontSize: 32, lineHeight: 40, fontWeight: '600', letterSpacing: -1 },
  h1: { fontSize: 26, lineHeight: 34, fontWeight: '600', letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

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

/** One place to render the loading / failed / nothing-here states of a query. */
export function QueryState({ query, empty, children }) {
  if (query.isLoading) return <ActivityIndicator style={{ marginTop: 24 }} color={theme.brand} />;
  if (query.isError) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeText}>{query.error?.response?.data?.message || 'Could not load this. Pull down to retry.'}</Text>
        <Button variant="ghost" onPress={() => query.refetch()}>
          Retry
        </Button>
      </View>
    );
  }
  if (empty && !(query.data || []).length) return <View style={styles.emptyState}><Text style={styles.empty}>{empty}</Text></View>;
  return children;
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
    borderRadius: 10,
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
    borderRadius: 12,
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
});
