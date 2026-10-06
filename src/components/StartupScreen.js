import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from './tokens';
import { FadeIn } from './motion';

// System type also renders this screen while the custom fonts are loading.
export default function StartupScreen() {
  return <View style={styles.screen}><FadeIn style={styles.center}><View style={styles.halo}><View style={styles.mark}><Text style={styles.markText}>PG</Text></View></View><Text style={styles.title}>PG Manager</Text><Text style={styles.subtitle}>A little less admin. A lot more clarity.</Text><ActivityIndicator color={theme.primary} style={{ marginTop: 28 }} accessibilityLabel="Loading your workspace" /></FadeIn><Text style={styles.footer}>YOUR PROPERTY. ALL TOGETHER.</Text></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  center: { alignItems: 'center', gap: 12 },
  halo: { width: 124, height: 124, borderRadius: 40, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  mark: { width: 80, height: 80, borderRadius: 26, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  title: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 48, color: theme.textMuted, fontSize: 10, letterSpacing: 2, textAlign: 'center' },
});
