import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonScreen } from './Skeleton';
import { FadeIn, Press, useReducedMotion } from './motion';
import { fonts, radius, shadow, spacing, theme, tones, typography } from './tokens';

export { colors, fonts, theme, tones, typography, spacing, radius, motion, shadow } from './tokens';
export { Press, FadeIn, useReducedMotion };

/* ───────────── Type ───────────── */

/** An all-caps kicker above a title. */
export const Eyebrow = ({ children, style }) => <Text style={[styles.eyebrow, style]}>{children}</Text>;

/** The top of every screen: optional kicker, a confident title, one line of context. */
export function PageHeader({ eyebrow, title, subtitle, right, onTitlePress, titleHint }) {
  const titleText = <Text style={[styles.pageTitle, onTitlePress && { flexShrink: 1 }]} numberOfLines={2}>{title}</Text>;
  return (
    <FadeIn style={styles.pageHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {!!eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {onTitlePress ? (
          <Press onPress={onTitlePress} scaleTo={0.98} accessibilityRole="button" accessibilityHint={titleHint} style={styles.pageTitleRow}>
            {titleText}
            <View style={styles.pageTitleChevron}><Ionicons name="chevron-down" size={16} color={theme.primaryText} /></View>
          </Press>
        ) : titleText}
        {!!subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </FadeIn>
  );
}

/* ───────────── Selection ───────────── */

export function Segmented({ options, value, onChange, label }) {
  return (
    <View accessibilityLabel={label} style={styles.segmented}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Press key={option.value} haptics="select" scaleTo={1} accessibilityRole="tab" accessibilityState={{ selected }}
            onPress={() => onChange(option.value)} style={[styles.segment, selected && styles.segmentSelected]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

/* ───────────── Layout ───────────── */

/** Screen chrome: safe-area insets (notch/home bar) plus the standard padding. */
export function Screen({ children, scroll = false, refreshControl, contentStyle, edges = ['top', 'left', 'right'] }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Keep phone layouts full width, and give tablets a comfortable reading measure.
  const layout = { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: width < 360 ? 16 : width >= 768 ? 32 : 20 };
  const bottom = { paddingBottom: Math.max(insets.bottom, spacing.xl) };
  if (!scroll) return <SafeAreaView edges={edges} style={styles.screenPlain}><View style={[styles.screen, layout, bottom, contentStyle]}>{children}</View></SafeAreaView>;
  return (
    <SafeAreaView edges={edges} style={styles.screenPlain}>
      <ScrollView contentContainerStyle={[styles.scrollBody, layout, bottom, contentStyle]} refreshControl={refreshControl} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, padded = true }) { return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>; }
export function Divider({ style }) { return <View style={[styles.divider, style]} />; }

/* ───────────── Buttons ───────────── */

const BUTTON_TONES = {
  primary: { bg: theme.primary, fg: '#ffffff' },
  secondary: { bg: theme.surface, fg: theme.textPrimary, border: true },
  ghost: { bg: theme.primarySubtle, fg: theme.primaryText },
  tertiary: { bg: 'transparent', fg: theme.primaryText },
  danger: { bg: theme.errorSubtle, fg: theme.error },
};

export function Button({ children, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, style, icon }) {
  const tone = BUTTON_TONES[variant] || BUTTON_TONES.primary;
  const blocked = disabled || loading;
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      onPress={onPress}
      disabled={blocked}
      haptics={variant === 'primary' ? 'press' : 'tap'}
      style={[styles.button, size === 'lg' && styles.buttonLg, size === 'sm' && styles.buttonSm, { backgroundColor: tone.bg }, tone.border && styles.buttonBordered, style]}
    >
      {loading ? <ActivityIndicator size="small" color={tone.fg} /> : icon}
      <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, { color: tone.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {children}
      </Text>
    </Press>
  );
}

/* ───────────── Inputs ───────────── */

export function Field({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder, error, hint, right, autoCapitalize = 'none', ...rest }) {
  const [focused, setFocused] = useState(false);
  const { onFocus, onBlur, style: inputStyle, ...inputProps } = rest;
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputBox, focused && styles.inputFocused, inputProps.editable === false && styles.inputDisabled, !!error && styles.inputError]}>
        <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} secureTextEntry={secureTextEntry} placeholder={placeholder || label}
          placeholderTextColor={theme.textDisabled} accessibilityLabel={label} autoCapitalize={autoCapitalize}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }} onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, inputProps.multiline && styles.inputMultiline, inputStyle]} {...inputProps} />
        {right}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <Field {...props} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
      right={(
        <Press haptics={null} scaleTo={1} accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible((v) => !v)} style={styles.fieldAction}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
        </Press>
      )} />
  );
}

/** A labelled on/off row, used for yes/no facts like "deposit paid". */
export function Toggle({ label, hint, value, onChange }) {
  return (
    <Press haptics="select" scaleTo={1} onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: !!value }} accessibilityLabel={label} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {!!hint && <Text style={styles.hintText}>{hint}</Text>}
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Press>
  );
}

/* ───────────── Status ───────────── */

export function Pill({ children, tone = 'muted' }) {
  const p = tones[tone] || tones.muted;
  return <View style={[styles.pill, { backgroundColor: p.bg }]}><Text style={[styles.pillText, { color: p.fg }]} numberOfLines={1}>{children}</Text></View>;
}

const BADGE_TONES = { PAID: 'ok', ACTIVE: 'ok', VACANT: 'ok', PARTIAL: 'warn', PENDING: 'warn', ON_NOTICE: 'warn', OVERDUE: 'danger', VACATED: 'muted', OCCUPIED: 'info', AVAILABLE: 'ok', INACTIVE: 'muted', COMPLETED: 'ok', CANCELLED: 'muted', OWNER: 'accent' };

/** API statuses arrive as SHOUTING_CASE; show them as sentence case. */
const statusLabel = (s) => (/^[A-Z_]+$/.test(s) ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : s);

export function Badge({ children }) {
  return <Pill tone={BADGE_TONES[children] || 'muted'}>{statusLabel(String(children))}</Pill>;
}

export function Stat({ label, value, hint, tone = 'default', icon, onPress }) {
  const accent = tone === 'default' ? theme.primary : theme[tone] || tones[tone]?.fg || theme.primary;
  const Container = onPress ? Press : View;
  return (
    <Container style={styles.stat} {...(onPress ? { onPress, accessibilityRole: 'button', accessibilityLabel: `${label}: ${value}`, accessibilityHint: `Open the full ${label.toLowerCase()} report` } : {})}>
      <View style={styles.statHead}>
        {icon ? <View style={[styles.statIcon, { backgroundColor: (tones[tone]?.bg || theme.primarySubtle) }]}><Ionicons name={icon} size={17} color={accent} /></View> : <View style={[styles.statDot, { backgroundColor: accent }]} />}
        <Text style={styles.statLabel}>{label}</Text>
        {!!onPress && <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />}
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </Container>
  );
}

/** A list item card. `icon` renders in a tinted medallion; a pressable row gets a chevron. */
export function Row({ title, subtitle, right, badge, onPress, icon, chevron = true, subtitleLines = 2 }) {
  const body = (
    <>
      {!!icon && <View style={styles.rowIcon}><Ionicons name={icon} size={19} color={theme.primary} /></View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle} numberOfLines={subtitleLines}>{subtitle}</Text>}
      </View>
      {badge ? <Badge>{badge}</Badge> : null}
      {!!right && <Text style={styles.rowRight}>{right}</Text>}
      {!!onPress && chevron && <Ionicons name="chevron-forward" size={17} color={theme.textDisabled} />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return <Press accessibilityRole="button" onPress={onPress} scaleTo={0.985} style={styles.row}>{body}</Press>;
}

export function SectionTitle({ children, action }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {action}
    </View>
  );
}

/** Inline message above a form's action. */
export function Notice({ message, tone = 'danger', icon }) {
  if (!message) return null;
  const p = { danger: tones.danger, warn: tones.warn, ok: tones.ok, info: tones.info, muted: { bg: theme.surfaceMuted, fg: theme.textSecondary }, accent: tones.accent }[tone] || tones.danger;
  return (
    <View style={[styles.notice, { backgroundColor: p.bg }]} accessibilityLiveRegion="polite">
      {!!icon && <Ionicons name={icon} size={18} color={p.fg} />}
      <Text style={[styles.noticeText, { color: p.fg }]}>{message}</Text>
    </View>
  );
}

/* ───────────── States ───────────── */

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
    return <StateView title={title} message={message} actionLabel="Try again" onAction={() => query.refetch()} tone="error" icon={kind === 'network' ? 'cloud-offline-outline' : 'alert-circle-outline'} />;
  }
  if (empty && !(query.data || []).length) return <StateView title="Nothing here yet" message={empty} />;
  return children;
}

/** An empty or error state that explains itself, with its icon in a tinted medallion. */
export function StateView({ title, message, actionLabel, onAction, tone = 'neutral', icon }) {
  const error = tone === 'error';
  return (
    <FadeIn style={styles.stateView}>
      <View style={[styles.stateIcon, error && { backgroundColor: theme.errorSubtle }]}>
        <Ionicons name={icon || (error ? 'alert-circle-outline' : 'file-tray-outline')} size={28} color={error ? theme.error : theme.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {!!message && <Text style={styles.stateMessage}>{message}</Text>}
      {!!actionLabel && <Button variant="secondary" onPress={onAction} style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>{actionLabel}</Button>}
    </FadeIn>
  );
}

/* ───────────── Styles ───────────── */

export const styles = StyleSheet.create({
  eyebrow: { ...typography.overline, color: theme.primaryText, marginBottom: spacing.sm },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, paddingTop: spacing.sm },
  pageTitle: { ...typography.display, color: theme.text },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  pageTitleChevron: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  pageSubtitle: { ...typography.body, color: theme.textSecondary, marginTop: spacing.xs },

  segmented: { flexDirection: 'row', padding: 4, gap: 4, backgroundColor: theme.surfaceMuted, borderRadius: radius.sm + 2 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.sm - 1 },
  segmentSelected: { backgroundColor: theme.surface, ...shadow.subtle },
  segmentText: { ...typography.label, color: theme.textMuted },
  segmentTextSelected: { color: theme.primaryText },

  screen: { flex: 1, backgroundColor: theme.bg, padding: spacing.lg, gap: spacing.lg },
  screenPlain: { flex: 1, backgroundColor: theme.bg },
  scrollBody: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },

  card: { backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.card },
  cardPadded: { padding: 20 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },

  button: { minHeight: 54, flexDirection: 'row', gap: spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, overflow: 'hidden' },
  buttonLg: { minHeight: 60 },
  buttonSm: { minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  buttonBordered: { borderWidth: 1.5, borderColor: theme.border },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.2, flexShrink: 1 },
  buttonTextSm: { fontSize: 14.5 },

  field: { gap: 10 },
  label: { ...typography.label, color: theme.textSecondary },
  inputBox: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.border, borderRadius: radius.md, backgroundColor: theme.surface, paddingHorizontal: spacing.lg + 2, gap: spacing.sm },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16.5, lineHeight: 22, color: theme.text, paddingVertical: spacing.md },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  fieldAction: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  inputFocused: { borderColor: theme.primary, backgroundColor: theme.primarySubtle },
  inputDisabled: { backgroundColor: theme.surfaceMuted },
  inputError: { borderColor: theme.error, backgroundColor: theme.errorSubtle },
  errorText: { ...typography.caption, color: theme.error, marginLeft: 2 },
  hintText: { ...typography.caption, color: theme.textMuted, marginLeft: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, minHeight: 56, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.subtle },
  toggleLabel: { ...typography.bodyStrong, color: theme.text },
  toggleTrack: { width: 48, height: 28, borderRadius: radius.pill, padding: 3, backgroundColor: theme.border, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: theme.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: theme.surface, ...shadow.card },
  toggleThumbOn: { transform: [{ translateX: 20 }] },

  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, flexShrink: 0 },
  pillText: { ...typography.caption, fontFamily: fonts.semibold },

  stat: { flex: 1, minHeight: 132, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, backgroundColor: theme.surface, padding: spacing.lg, gap: 6, justifyContent: 'center', ...shadow.card },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { ...typography.label, color: theme.textMuted },
  statValue: { ...typography.figure, color: theme.text },
  statHint: { ...typography.caption, color: theme.textMuted },

  row: { minHeight: 82, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.subtle },
  rowIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...typography.bodyStrong, color: theme.text },
  rowSubtitle: { ...typography.small, marginTop: 2, color: theme.textMuted },
  rowRight: { ...typography.label, color: theme.primaryText, flexShrink: 1, textAlign: 'right' },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md },
  sectionTitleText: { ...typography.h3, color: theme.text, flexShrink: 1 },
  empty: { ...typography.small, color: theme.textMuted, paddingVertical: spacing.md, textAlign: 'center' },

  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: radius.md, padding: spacing.md + 2 },
  noticeText: { ...typography.small, flex: 1 },

  stateView: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.subtle },
  stateIcon: { width: 68, height: 68, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primarySubtle, marginBottom: spacing.sm },
  stateTitle: { ...typography.h3, color: theme.text, textAlign: 'center' },
  stateMessage: { ...typography.body, color: theme.textMuted, textAlign: 'center', maxWidth: 300 },
});
