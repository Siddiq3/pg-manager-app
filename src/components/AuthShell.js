import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, theme, typography } from './ui';

export function AuthShell({ eyebrow = 'PG MANAGER', title, subtitle, children, footer }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen scroll>
        <View style={styles.brandRow}>
          <View style={styles.mark}><Text style={styles.markText}>PG</Text></View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.form}>{children}</View>
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function AuthLink({ children, onPress }) {
  return <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}><Text style={styles.link}>{children}</Text></Pressable>;
}

export function AuthNotice({ message, tone = 'error' }) {
  if (!message) return null;
  return (
    <View style={[styles.notice, tone === 'success' && styles.successNotice]}>
      <Text style={[styles.noticeText, tone === 'success' && styles.successText]}>{message}</Text>
    </View>
  );
}

export function getAuthError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  const fieldErrors = data?.details?.fieldErrors;
  if (fieldErrors) {
    const messages = Object.values(fieldErrors).flat().filter(Boolean);
    if (messages.length) return messages.join('\n');
  }
  return data?.message || fallback;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 },
  mark: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.brand, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: .4 },
  eyebrow: { ...typography.label, color: theme.brand, letterSpacing: .8 },
  heading: { gap: 6, marginTop: 22, marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -.8, color: theme.text },
  subtitle: { ...typography.body, color: theme.muted, maxWidth: 520 },
  form: { gap: 13 },
  footer: { alignItems: 'center', marginTop: 4, paddingBottom: 6 },
  link: { ...typography.small, color: theme.brand, fontWeight: '700' },
  notice: { backgroundColor: theme.dangerWeak, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: theme.border },
  noticeText: { ...typography.small, color: theme.danger },
  successNotice: { backgroundColor: theme.okWeak, borderColor: theme.border },
  successText: { color: theme.ok },
});
