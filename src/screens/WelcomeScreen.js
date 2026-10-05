import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, FadeIn, Screen, fonts, radius, shadow, spacing, theme, typography } from '../components/ui';
import { AuthLink, BrandMark } from '../components/AuthShell';

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen>
      <FadeIn><BrandMark /></FadeIn>

      {/* The hero takes the free vertical space, so it is centred on any height of phone. */}
      <View style={styles.heroRegion}>
        <FadeIn delay={120} style={styles.heroCard}>
          <View style={styles.heroHead}>
            <View style={styles.heroIcon}><Ionicons name="business" size={18} color={theme.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>Sai Residency PG</Text>
              <Text style={styles.heroMeta}>24 rooms · 62 beds</Text>
            </View>
            <View style={styles.livePill}><Text style={styles.liveText}>92% full</Text></View>
          </View>
          <View style={styles.bar}><View style={styles.barFill} /></View>
          <View style={styles.heroStats}>
            <HeroStat icon="bed-outline" value="57" label="Occupied" />
            <HeroStat icon="sparkles-outline" value="5" label="Vacant" />
            <HeroStat icon="wallet-outline" value="₹1.2L" label="Collected" />
          </View>
        </FadeIn>
      </View>

      <FadeIn delay={260}>
        <Text style={styles.title}>Run your PG,{'\n'}from your pocket.</Text>
        <Text style={styles.subtitle}>Rooms, tenants and rent — all in one simple place.</Text>
      </FadeIn>

      <FadeIn delay={420} style={styles.actions}>
        <Button size="lg" onPress={() => navigation.navigate('Register')}>Create account</Button>
        <View style={styles.inline}><Text style={styles.muted}>Already have an account? </Text><AuthLink onPress={() => navigation.navigate('Login')}>Sign in</AuthLink></View>
      </FadeIn>
    </Screen>
  );
}

function HeroStat({ icon, value, label }) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRegion: { flex: 1, justifyContent: 'center', minHeight: 240 },
  heroCard: { backgroundColor: theme.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.lift, transform: [{ rotate: '-2deg' }] },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  heroName: { ...typography.bodyStrong, color: theme.text },
  heroMeta: { ...typography.caption, color: theme.textMuted },
  livePill: { backgroundColor: theme.successSubtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  liveText: { ...typography.caption, fontFamily: fonts.semibold, color: theme.success },
  bar: { height: 8, borderRadius: 4, backgroundColor: theme.surfaceMuted, overflow: 'hidden' },
  barFill: { width: '92%', height: '100%', borderRadius: 4, backgroundColor: theme.primary },
  heroStats: { flexDirection: 'row', gap: spacing.sm },
  heroStat: { flex: 1, backgroundColor: theme.bg, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
  statValue: { ...typography.h2, fontSize: 22, color: theme.text, marginTop: 4 },
  statLabel: { ...typography.caption, color: theme.textMuted },
  title: { ...typography.display, fontSize: 37, lineHeight: 43, letterSpacing: -1.1, color: theme.text },
  subtitle: { ...typography.body, color: theme.textSecondary, marginTop: spacing.md, maxWidth: 320 },
  actions: { gap: spacing.md, paddingBottom: spacing.sm, marginTop: spacing.md },
  inline: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', minHeight: 44 },
  muted: { ...typography.small, color: theme.textMuted },
});
