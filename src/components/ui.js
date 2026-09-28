import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const theme = {
  bg: '#f4f6f5',
  surface: '#ffffff',
  border: '#e2e7e4',
  text: '#16211c',
  muted: '#6b7772',
  brand: '#15654a',
  brandWeak: '#e7f2ed',
  danger: '#b42318',
  dangerWeak: '#fdecea',
  warn: '#b54708',
  warnWeak: '#fdf1e3',
  ok: '#067647',
  okWeak: '#e7f6ee',
};

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
        variant === 'danger' && styles.dangerButton,
        pressed && !blocked && styles.pressed,
        blocked && styles.disabledButton,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : theme.brand} />}
      <Text style={[styles.buttonText, variant !== 'primary' && styles.ghostText, variant === 'danger' && styles.dangerText]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, error, autoCapitalize = 'none', ...rest }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder || label}
        placeholderTextColor="#9aa5a0"
        style={[styles.input, !!error && styles.inputError]}
        autoCapitalize={autoCapitalize}
        {...rest}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function Stat({ label, value, hint, tone = 'default' }) {
  return (
    <View style={[styles.stat, tone !== 'default' && { borderLeftColor: theme[tone], borderLeftWidth: 3 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  );
}

const BADGE_TONES = { PAID: 'ok', ACTIVE: 'ok', VACANT: 'ok', PARTIAL: 'warn', PENDING: 'danger', VACATED: 'muted', OCCUPIED: 'muted' };

export function Badge({ children }) {
  const tone = BADGE_TONES[children] || 'muted';
  const colors = {
    ok: [theme.okWeak, theme.ok],
    warn: [theme.warnWeak, theme.warn],
    danger: [theme.dangerWeak, theme.danger],
    muted: ['#eef1ef', theme.muted],
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
      <View style={{ flex: 1 }}>
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
  if (empty && !(query.data || []).length) return <Text style={styles.empty}>{empty}</Text>;
  return children;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 18, gap: 14 },
  screenPlain: { flex: 1, backgroundColor: theme.bg },
  scrollBody: { padding: 18, gap: 14, paddingBottom: 32 },
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
  dangerButton: { backgroundColor: theme.dangerWeak },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  ghostText: { color: theme.brand },
  dangerText: { color: theme.danger },
  field: { gap: 6 },
  label: { color: '#4a5651', fontWeight: '600', fontSize: 13 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d2d9d5',
    borderRadius: 10,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    color: theme.text,
  },
  inputError: { borderColor: theme.danger },
  errorText: { color: theme.danger, fontSize: 12 },
  stat: {
    flex: 1,
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 14,
    gap: 2,
    justifyContent: 'center',
  },
  statLabel: { color: theme.muted, fontWeight: '600', fontSize: 12 },
  statValue: { color: theme.text, fontSize: 24, fontWeight: '800' },
  statHint: { color: theme.muted, fontSize: 11 },
  row: {
    minHeight: 64,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: { color: theme.text, fontWeight: '700' },
  rowSubtitle: { marginTop: 3, color: theme.muted, fontSize: 13 },
  rowRight: { color: theme.brand, fontWeight: '700' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitleText: { color: theme.text, fontWeight: '800', fontSize: 17 },
  empty: { color: theme.muted, paddingVertical: 12 },
  notice: { backgroundColor: theme.dangerWeak, borderRadius: 12, padding: 14, gap: 10 },
  noticeText: { color: theme.danger },
});
