import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Screen, theme, typography } from '../components/ui';
import { AuthLink } from '../components/AuthShell';

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen scroll contentStyle={{ justifyContent: 'space-between' }}>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <View style={styles.mark}><Text style={styles.markText}>PG</Text></View>
          <Text style={styles.brand}>PG MANAGER</Text>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCard} accessible accessibilityLabel="Preview: rooms, occupancy and rent tracking">
            <Text style={styles.statLabel}>YOUR PG, AT A GLANCE</Text>
            <View style={styles.heroLine} />
            <View style={styles.heroStats}>
              <View><Text style={styles.statValue}>Rooms</Text><Text style={styles.statLabel}>Track beds</Text></View>
              <View><Text style={styles.statValue}>Tenants</Text><Text style={styles.statLabel}>Stay organised</Text></View>
              <View><Text style={styles.statValue}>Rent</Text><Text style={styles.statLabel}>Rent tracking</Text></View>
            </View>
          </View>
          <Text style={styles.title}>Run your PG,{'\n'}from your pocket.</Text>
          <Text style={styles.subtitle}>Manage rooms, tenants and rent from one simple place.</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button onPress={() => navigation.navigate('Register')} style={styles.primary}>Create account</Button>
        <View style={styles.inline}><Text style={styles.muted}>Already have an account? </Text><AuthLink onPress={() => navigation.navigate('Login')}>Sign in</AuthLink></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, gap: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  mark: { width: 40, height: 40, borderRadius: 13, backgroundColor: theme.brand, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  brand: { ...typography.label, color: theme.brand, letterSpacing: 1.2 },
  hero: { flex: 1, justifyContent: 'center', gap: 14 },
  heroCard: { backgroundColor: theme.brandWeak, borderRadius: 16, padding: 16, minHeight: 150, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border },
  heroLine: { width: 58, height: 8, borderRadius: 8, backgroundColor: theme.brand },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  statValue: { ...typography.h3, color: theme.text },
  statLabel: { ...typography.caption, color: theme.muted, marginTop: 2 },
  title: { fontSize: 34, lineHeight: 42, fontWeight: '700', letterSpacing: -1.3, color: theme.text },
  subtitle: { ...typography.body, color: theme.muted, maxWidth: 480 },
  actions: { gap: 18, paddingBottom: 12 },
  primary: { minHeight: 54, borderRadius: 14 },
  inline: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { ...typography.small, color: theme.muted },
});
