import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, theme, typography } from '../components/ui';
import { AuthLink } from '../components/AuthShell';

function Feature({ icon, text }) { return <View style={styles.feature}><Ionicons name={icon} size={18} color={theme.brand}/><Text style={styles.featureText}>{text}</Text></View>; }

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <View style={styles.mark}><Text style={styles.markText}>PG</Text></View>
          <Text style={styles.brand}>PG MANAGER</Text>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="business-outline" size={30} color={theme.brand} /></View>
          <Text style={styles.title}>Manage your PG{'\n'}without the paperwork.</Text>
          <Text style={styles.subtitle}>Rooms, tenants, vacancies and rent — all in one simple app.</Text>
          <View style={styles.featureList}>
            <Feature icon="bed-outline" text="See room and bed vacancy quickly" />
            <Feature icon="people-outline" text="Keep tenant details organised" />
            <Feature icon="wallet-outline" text="Track rent and pending payments" />
          </View>
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
  top: { flex: 1, gap: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 },
  mark: { width: 38, height: 38, borderRadius: 10, backgroundColor: theme.brand, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  brand: { ...typography.label, color: theme.brand, letterSpacing: .8 },
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: theme.brandWeak, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featureList: { gap: 10, marginTop: 10 },
  feature: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 8 },
  featureText: { ...typography.small, color: theme.textSecondary, flex: 1 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1, color: theme.text },
  subtitle: { ...typography.body, color: theme.muted, maxWidth: 480 },
  actions: { gap: 14, paddingBottom: 8 },
  primary: { minHeight: 48 },
  inline: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { ...typography.small, color: theme.muted },
});
