import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { FadeIn, Notice, Screen, fonts, theme, typography } from './ui';

/** The PG Manager wordmark: a violet tile and the name. */
export function BrandMark({ size = 30 }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.mark, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 3.2 }]}><Text style={styles.markText}>PG</Text></View>
      <Text style={styles.wordmark}>PG Manager</Text>
    </View>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen scroll contentStyle={styles.shell}>
        <FadeIn>
          <BrandMark />
          <View style={styles.rule} />
          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </FadeIn>
        <FadeIn delay={120} style={styles.form}>{children}</FadeIn>
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function AuthLink({ children, onPress }) {
  // A Text, not a pressable View: it sits inside sentences ("New here? Create an account")
  // and a View there renders off the text baseline.
  return <Text accessibilityRole="link" onPress={onPress} suppressHighlighting style={styles.link}>{children}</Text>;
}

export function AuthNotice({ message, tone = 'error' }) {
  return <Notice message={message} tone={tone === 'success' ? 'ok' : 'danger'} icon={tone === 'success' ? 'checkmark-circle' : 'alert-circle'} />;
}

export function getAuthError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'The request timed out. Please try again.';
  }
  if (error?.isAxiosError && !error.response) {
    return 'Could not connect to the server. Check your internet connection and try again.';
  }
  const fieldErrors = data?.details?.fieldErrors;
  if (fieldErrors) {
    const messages = Object.values(fieldErrors).flat().filter(Boolean);
    if (messages.length) return messages.join('\n');
  }
  return data?.message || fallback;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  shell: { maxWidth: 560, justifyContent: 'center', paddingTop: 32, paddingBottom: 32 },
  rule: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.primaryTint, marginTop: 32 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  mark: { backgroundColor: theme.brand, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontFamily: fonts.display, fontSize: 15, letterSpacing: 0.2 },
  wordmark: { fontFamily: fonts.display, fontSize: 21, letterSpacing: -0.5, color: theme.text },
  heading: { gap: 8, marginTop: 20, marginBottom: 12 },
  title: { ...typography.display, color: theme.text },
  subtitle: { ...typography.body, color: theme.textSecondary, maxWidth: 520 },
  form: { gap: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 28, padding: 20 },
  footer: { alignItems: 'center', marginTop: 4, paddingBottom: 8 },
  link: { ...typography.small, fontFamily: fonts.semibold, color: theme.primaryText },
});
