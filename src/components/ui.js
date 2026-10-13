import React, { createContext, useContext, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeaderShownContext } from '@react-navigation/elements';
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
  // Past four options the equal-width segments break labels mid-word on phones, so scroll instead.
  const scroll = options.length > 4;
  const segments = options.map((option) => {
    const selected = value === option.value;
    return (
      <Press key={option.value} haptics="select" scaleTo={1} accessibilityRole="tab" accessibilityState={{ selected }}
        onPress={() => onChange(option.value)} style={[styles.segment, scroll && styles.segmentScroll, selected && styles.segmentSelected]}>
        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={1}>{option.label}</Text>
      </Press>
    );
  });
  if (!scroll) return <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.segmented}>{segments}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={label}
      style={styles.segmentedScroll} contentContainerStyle={styles.segmented}>
      {segments}
    </ScrollView>
  );
}

/* ───────────── Layout ───────────── */

/** Screen chrome: safe-area insets (notch/home bar) plus the standard padding. */
export function Screen({ children, scroll = false, refreshControl, contentStyle, edges = ['top', 'left', 'right'] }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Under a native header the status-bar inset is already applied; adding it again leaves a gap.
  if (useContext(HeaderShownContext)) edges = edges.filter((edge) => edge !== 'top');
  // Keep phone layouts full width, and give tablets a comfortable reading measure.
  const layout = { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: width >= 768 ? 32 : 16 };
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

/** Rows grouped into one surface with hairline dividers, instead of a stack of separate cards. */
const InList = createContext(false);
export function List({ children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (!items.length) return null;
  return (
    <InList.Provider value>
      <View style={[styles.list, style]}>
        {items.map((item, i) => <React.Fragment key={item.key ?? i}>{i > 0 && <View style={styles.listDivider} />}{item}</React.Fragment>)}
      </View>
    </InList.Provider>
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

export function Button({ children, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, style, icon, accessibilityLabel }) {
  const tone = BUTTON_TONES[variant] || BUTTON_TONES.primary;
  const blocked = disabled || loading;
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
          placeholderTextColor={theme.textMuted} accessibilityLabel={label} accessibilityHint={error || hint} autoCapitalize={autoCapitalize}
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
  const rowStyle = useContext(InList) ? styles.rowGrouped : styles.row;
  const body = (
    <>
      {!!icon && <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={theme.primary} /></View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle} numberOfLines={subtitleLines}>{subtitle}</Text>}
      </View>
      {badge ? <Badge>{badge}</Badge> : null}
      {!!right && <Text style={styles.rowRight}>{right}</Text>}
      {!!onPress && chevron && <Ionicons name="chevron-forward" size={17} color={theme.textDisabled} />}
    </>
  );
  if (!onPress) return <View style={rowStyle}>{body}</View>;
  return <Press accessibilityRole="button" onPress={onPress} scaleTo={0.99} style={rowStyle}>{body}</Press>;
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
        <Ionicons name={icon || (error ? 'alert-circle-outline' : 'file-tray-outline')} size={24} color={error ? theme.error : theme.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {!!message && <Text style={styles.stateMessage}>{message}</Text>}
      {!!actionLabel && <Button variant="secondary" onPress={onAction} style={{ alignSelf: 'stretch', marginTop: spacing.sm }}>{actionLabel}</Button>}
    </FadeIn>
  );
}

/* ───────────── Styles ───────────── */

export const styles = StyleSheet.create({
  eyebrow: { ...typography.overline, color: theme.primaryText, marginBottom: spacing.xs },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.xs },
  pageTitle: { ...typography.display, color: theme.text },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  pageTitleChevron: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  pageSubtitle: { ...typography.small, color: theme.textMuted, marginTop: 2 },

  segmented: { flexDirection: 'row', padding: 3, gap: 3, backgroundColor: theme.surfaceMuted, borderRadius: radius.sm },
  segment: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.sm - 3 },
  segmentScroll: { flex: 0, paddingHorizontal: spacing.lg },
  segmentedScroll: { flexGrow: 0, borderRadius: radius.sm, backgroundColor: theme.surfaceMuted },
  segmentSelected: { backgroundColor: theme.surface, ...shadow.subtle },
  segmentText: { ...typography.label, color: theme.textMuted },
  segmentTextSelected: { color: theme.primaryText },

  screen: { flex: 1, backgroundColor: theme.bg, paddingVertical: spacing.md, gap: spacing.md },
  screenPlain: { flex: 1, backgroundColor: theme.bg },
  scrollBody: { flexGrow: 1, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  card: { backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.subtle },
  cardPadded: { padding: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },

  button: { minHeight: 48, flexDirection: 'row', gap: spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, overflow: 'hidden' },
  buttonLg: { minHeight: 52 },
  buttonSm: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  buttonBordered: { borderWidth: 1, borderColor: theme.border },
  buttonText: { fontFamily: fonts.semibold, fontSize: 15, letterSpacing: -0.2, flexShrink: 1 },
  buttonTextSm: { fontSize: 14 },

  field: { gap: 6 },
  label: { ...typography.label, color: theme.textSecondary },
  inputBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, backgroundColor: theme.surface, paddingHorizontal: spacing.md + 2, gap: spacing.sm },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 21, color: theme.text, paddingVertical: spacing.sm + 2 },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },
  fieldAction: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  inputFocused: { borderColor: theme.primary },
  inputDisabled: { backgroundColor: theme.surfaceMuted },
  inputError: { borderColor: theme.error, backgroundColor: theme.errorSubtle },
  errorText: { ...typography.caption, color: theme.error, marginLeft: 2 },
  hintText: { ...typography.caption, color: theme.textMuted, marginLeft: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.subtle },
  toggleLabel: { ...typography.bodyStrong, color: theme.text },
  toggleTrack: { width: 48, height: 28, borderRadius: radius.pill, padding: 3, backgroundColor: theme.border, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: theme.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: theme.surface, ...shadow.card },
  toggleThumbOn: { transform: [{ translateX: 20 }] },

  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.pill, flexShrink: 0 },
  pillText: { ...typography.caption, fontFamily: fonts.semibold },

  stat: { flex: 1, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, backgroundColor: theme.surface, padding: spacing.md + 2, gap: 4, ...shadow.subtle },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { ...typography.label, color: theme.textMuted },
  statValue: { ...typography.figure, color: theme.text },
  statHint: { ...typography.caption, color: theme.textMuted },

  row: { minHeight: 60, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.md + 2, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.subtle },
  rowGrouped: { minHeight: 56, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md + 2, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  list: { backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, overflow: 'hidden', ...shadow.subtle },
  listDivider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: spacing.md + 2 + 36 + spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...typography.bodyStrong, color: theme.text },
  rowSubtitle: { ...typography.small, marginTop: 1, color: theme.textMuted },
  rowRight: { ...typography.label, color: theme.primaryText, flexShrink: 1, textAlign: 'right' },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm, marginBottom: -spacing.xs },
  sectionTitleText: { ...typography.h3, color: theme.text, flexShrink: 1 },
  empty: { ...typography.small, color: theme.textMuted, paddingVertical: spacing.md, textAlign: 'center' },

  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  noticeText: { ...typography.small, flex: 1 },

  stateView: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.subtle },
  stateIcon: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primarySubtle, marginBottom: spacing.sm },
  stateTitle: { ...typography.h3, color: theme.text, textAlign: 'center' },
  stateMessage: { ...typography.small, color: theme.textMuted, textAlign: 'center', maxWidth: 300 },
});
