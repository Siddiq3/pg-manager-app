import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Button, FadeIn, Screen, radius, shadow, theme, typography, useReducedMotion } from '../components/ui';
import { AuthLink, BrandMark } from '../components/AuthShell';

export default function WelcomeScreen({ navigation }) {
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 740 || width < 360 || fontScale > 1.2;
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(0.92, { duration: reduced ? 0 : 1200, easing: Easing.out(Easing.cubic) });
    if (reduced) float.value = 0;
    else float.value = withRepeat(withSequence(withTiming(-6, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })), -1);
    return () => { cancelAnimation(float); cancelAnimation(progress); };
  }, [reduced, float, progress]);
  const floating = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Screen scroll contentStyle={styles.page}>
      <FadeIn><BrandMark /></FadeIn>
      <View style={[styles.heroRegion, compact && styles.heroCompact]} accessibilityLabel="Example property dashboard">
        <View style={styles.orbit} /><View style={styles.orbitInner} />
        <FadeIn delay={120} style={styles.preview}>
          <Animated.View style={[styles.heroCard, floating]}>
            <View style={styles.heroHead}>
              <View style={styles.heroIcon}><Ionicons name="business-outline" size={22} color="#fff" /></View>
              <View style={{ flex: 1 }}><Text style={styles.heroName}>Sai Residency</Text><Text style={styles.heroMeta}>DEMO</Text></View>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.inkMuted} />
            </View>
            <View style={styles.occupancy}><View><Text style={styles.heroMeta}>Occupancy</Text><Text style={styles.occupancyValue}>92<Text style={styles.percent}>%</Text></Text></View></View>
            <View style={styles.bar}><Animated.View style={[styles.barFill, fill]} /></View>
            <View style={styles.heroStats}><HeroStat value="24" label="Rooms" /><HeroStat value="5" label="Vacant" /><HeroStat value="₹1.2L" label="Collected" /></View>
          </Animated.View>
        </FadeIn>
        <FadeIn delay={340} style={styles.notification}><View style={styles.check}><Ionicons name="checkmark" size={18} color={theme.success} /></View><View style={{ flex: 1 }}><Text style={styles.notificationTitle}>Rent received</Text></View><Ionicons name="sparkles" size={16} color={theme.primary} /></FadeIn>
      </View>
      <FadeIn delay={220} style={styles.copy}>
        <Text style={[styles.title, compact && styles.titleCompact]}>Your PG.{'\n'}<Text style={styles.accent}>Made simple.</Text></Text>
        <Text style={styles.subtitle}>Rooms, tenants and rent. All together.</Text>
      </FadeIn>
      <FadeIn delay={420} style={styles.actions}>
        <Button size="lg" icon={<Ionicons name="arrow-forward" size={20} color="#fff" />} onPress={() => navigation.navigate('Register')}>Get started</Button>
        <View style={styles.inline}><AuthLink onPress={() => navigation.navigate('Login')}>Sign in</AuthLink></View>
      </FadeIn>
    </Screen>
  );
}
function HeroStat({ value, label }) { return <View style={styles.heroStat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  page: { maxWidth: 600, gap: 24 },
  heroRegion: { flexGrow: 1, minHeight: 310, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  heroCompact: { minHeight: 280 },
  orbit: { position: 'absolute', width: 290, height: 290, borderRadius: 145, borderWidth: 1, borderColor: theme.primaryTint, alignSelf: 'center', backgroundColor: theme.primarySubtle },
  orbitInner: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: theme.primaryTint, alignSelf: 'center' },
  preview: { width: '100%' },
  heroCard: { backgroundColor: theme.ink, borderRadius: radius.xl, padding: 22, gap: 18, ...shadow.lift },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroName: { ...typography.bodyStrong, color: '#fff' },
  heroMeta: { ...typography.caption, fontSize: 10, color: theme.inkMuted, marginTop: 3 },
  occupancy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  occupancyValue: { ...typography.display, color: '#fff', fontSize: 46, lineHeight: 52 },
  percent: { fontSize: 24, color: theme.inkMuted },
  bar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: '#AB97FF' },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, gap: 8 },
  heroStat: { flex: 1, gap: 4 },
  statValue: { ...typography.h2, fontSize: 22, color: '#fff' },
  statLabel: { ...typography.caption, fontSize: 10, color: theme.inkMuted },
  notification: { marginTop: -8, marginLeft: 14, marginRight: -8, backgroundColor: theme.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border, ...shadow.lift },
  check: { width: 34, height: 34, borderRadius: 12, backgroundColor: theme.successSubtle, alignItems: 'center', justifyContent: 'center' },
  notificationTitle: { ...typography.label, fontSize: 12, color: theme.text },
  copy: { gap: 12 },
  title: { ...typography.display, fontSize: 40, lineHeight: 46, letterSpacing: -1.3, color: theme.text },
  titleCompact: { fontSize: 34, lineHeight: 40 },
  accent: { color: theme.primary },
  subtitle: { ...typography.body, color: theme.textMuted },
  actions: { gap: 8, marginTop: 'auto' },
  inline: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', minHeight: 44 },
});
