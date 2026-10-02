import React, { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonScreen } from './Skeleton';
import { Ionicons } from '@expo/vector-icons';

export { colors, theme, typography, spacing, radius, motion } from './tokens';
import { theme, typography, spacing, radius } from './tokens';

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
export function Screen({ children, scroll = false, refreshControl, contentStyle }) {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const edges = [...(headerHeight ? [] : ['top']), 'left', 'right', ...(tabBarHeight ? [] : ['bottom'])];
  return (
    <SafeAreaView edges={edges} style={styles.screenPlain}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
        {scroll ? <ScrollView contentContainerStyle={[styles.scrollBody, contentStyle]} refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{children}</ScrollView>
          : <View style={[styles.screen, contentStyle]}>{children}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return <View style={styles.pageHeader}><View style={{ flex: 1, minWidth: 0 }}>
    <Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
  </View>{action}</View>;
}

export function FormSection({ title, description, children }) {
  return <View style={styles.formSection}><View style={{ gap: 4 }}>
    <Text accessibilityRole="header" style={styles.formTitle}>{title}</Text>
    {!!description && <Text style={styles.hintText}>{description}</Text>}
  </View>{children}</View>;
}

export function Button({ children, onPress, variant = 'primary', disabled = false, loading = false, style, icon }) {
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
      {!loading && icon}
      <Text style={[styles.buttonText, variant !== 'primary' && styles.ghostText, variant === 'secondary' && { color: theme.textSecondary }, variant === 'danger' && styles.dangerText, blocked && { color: theme.textDisabled }]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, error, hint, right, autoCapitalize = 'none', ...rest }) {
  const [focused, setFocused] = useState(false);
  const { onFocus, onBlur, style: inputStyle, ...inputProps } = rest;
  return <View style={styles.field}>
    {!!label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputBox, focused && styles.inputFocused, inputProps.editable === false && styles.inputDisabled, !!error && styles.inputError]}>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} secureTextEntry={secureTextEntry} placeholder={placeholder || label} placeholderTextColor={theme.textDisabled} accessibilityLabel={label}
        onFocus={e=>{setFocused(true);onFocus?.(e)}} onBlur={e=>{setFocused(false);onBlur?.(e)}} style={[styles.input,inputStyle]} autoCapitalize={autoCapitalize} {...inputProps}/>
      {right}
    </View>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
    {!error && !!hint && <Text style={styles.hintText}>{hint}</Text>}
  </View>;
}

export function PasswordField(props) {
  const [visible,setVisible]=useState(false);
  return <Field {...props} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} right={<Pressable accessibilityRole="button" accessibilityLabel={visible?'Hide password':'Show password'} onPress={()=>setVisible(v=>!v)} style={styles.fieldAction}><Ionicons name={visible?'eye-off-outline':'eye-outline'} size={20} color={theme.muted}/></Pressable>}/>;
}

export function Card({children,style,padded=true}) { return <View style={[styles.card,padded&&styles.cardPadded,style]}>{children}</View>; }
export function Divider({style}) { return <View style={[styles.divider,style]}/>; }
export function Pill({children,tone='muted'}) { const p={ok:[theme.okWeak,theme.ok],warn:[theme.warnWeak,theme.warn],danger:[theme.dangerWeak,theme.danger],muted:[theme.surfaceMuted,theme.muted]}[tone]||[theme.surfaceMuted,theme.muted]; return <View style={[styles.pill,{backgroundColor:p[0]}]}><Text style={[styles.pillText,{color:p[1]}]}>{children}</Text></View>; }

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
      <Text style={[styles.badgeText, { color: colors[1] }]}>{String(children).replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase())}</Text>
    </View>
  );
}

export function Row({ title, subtitle, right, badge, onPress, selected = false, flat = false }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={selected ? { selected: true } : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, flat && { borderWidth: 0, padding: 0, backgroundColor: 'transparent', minHeight: 52 }, selected && { borderColor: theme.brand, backgroundColor: theme.brandWeak }, pressed && onPress && styles.pressed]}
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
      <View style={[styles.stateIcon, error && { backgroundColor: theme.dangerWeak }]}><Ionicons name={error ? 'alert-circle-outline' : 'file-tray-outline'} size={22} color={error ? theme.danger : theme.brand} /></View>
      <Text style={styles.stateTitle}>{title}</Text>
      {!!message && <Text style={styles.stateMessage}>{message}</Text>}
      {!!actionLabel && <Button variant={error ? 'ghost' : 'secondary'} onPress={onAction}>{actionLabel}</Button>}
    </View>
  );
}

export const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  pageTitle: { ...typography.h1, color: theme.text },
  pageSubtitle: { ...typography.small, color: theme.muted, marginTop: 4 },
  formSection: { gap: spacing.md, backgroundColor: theme.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.border },
  formTitle: { ...typography.h3, color: theme.text },
  segmented: { flexDirection: 'row', padding: 4, gap: 4, backgroundColor: theme.surfaceMuted, borderRadius: 10 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 7 },
  segmentSelected: { backgroundColor: theme.surface },
  segmentText: { ...typography.small, color: theme.textSecondary, fontWeight: '600' },
  screen: { flex: 1, padding: spacing.lg, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  screenPlain: { flex: 1, backgroundColor: theme.bg },
  scrollBody: { flexGrow: 1, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: 720, alignSelf: 'center' },
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
  buttonText: { flexShrink: 1, paddingVertical: 10, ...typography.small, color: '#fff', fontWeight: '600', textAlign: 'center' },
  ghostText: { color: theme.brand },
  dangerText: { color: theme.danger },
  field: { gap: 6 },
  label: { ...typography.label, color: theme.textSecondary },
  inputBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.borderStrong, borderRadius: radius.sm, backgroundColor: theme.surface },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 14, color: theme.text, fontSize: 16, paddingVertical: 12 },
  fieldAction: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  inputFocused: { borderColor: theme.primary, backgroundColor: theme.primarySubtle },
  inputDisabled: { backgroundColor: theme.surfaceMuted, color: theme.textDisabled },
  inputError: { borderColor: theme.danger },
  errorText: { color: theme.danger, fontSize: 12 },
  hintText: { ...typography.caption, color: theme.muted },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: radius.lg },
  cardPadded: { padding: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { ...typography.caption, fontWeight: '600' },
  stat: {
    flex: 1,
    minWidth: 140,
    minHeight: 94,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 14,
    gap: 6,
    justifyContent: 'center',
  },
  statLabel: { color: theme.muted, fontWeight: '600', fontSize: 12 },
  statValue: { color: theme.text, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statHint: { ...typography.caption, color: theme.muted },
  row: {
    minHeight: 68,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: { ...typography.body, color: theme.text, fontWeight: '600' },
  rowSubtitle: { ...typography.small, marginTop: 4, color: theme.muted },
  rowRight: { ...typography.small, color: theme.brand, fontWeight: '600', flexShrink: 1, maxWidth: '40%', textAlign: 'right' },
  badge: { flexShrink: 1, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  sectionTitleText: { ...typography.h3, color: theme.text, flexShrink: 1 },
  empty: { ...typography.small, color: theme.muted, paddingVertical: 16 },
  emptyState: { padding: 20, backgroundColor: theme.surfaceMuted, borderRadius: 10 },
  notice: { backgroundColor: theme.dangerWeak, borderRadius: 12, padding: 14, gap: 10 },
  noticeText: { color: theme.danger },
  stateView: { minHeight: 164, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.borderSubtle },
  stateError: { backgroundColor: theme.dangerWeak, borderColor: theme.border },
  stateIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceMuted },
  stateTitle: { ...typography.h3, color: theme.text, textAlign: 'center' },
  stateMessage: { ...typography.small, color: theme.muted, textAlign: 'center', maxWidth: 320 },
});
