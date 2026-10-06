import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { FadeIn, Press, Screen, fonts, shadow, theme, typography, useReducedMotion } from '../components/ui';
import { BrandMark } from '../components/AuthShell';

const DEMO = { occupancy: 92, occupied: 57, vacant: 5, rooms: 24, collected: 120000 };
const COUNTER_DELAY = 500;
const COUNTER_DURATION = 1900;
const COLLECTION_BARS = [16, 25, 20, 36, 31, 45, 56];
const formatAmount = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

// One short, shared counter timeline; values settle instead of endlessly resetting.
// React updates are capped at 30fps, while floating and progress run on the UI thread.
function useDemoCounters(reduced, focused) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!focused) return undefined;
    if (reduced) { setProgress(1); return undefined; }
    setProgress(0);
    let frame;
    let started;
    let lastPaint = 0;
    const tick = (time) => {
      if (started === undefined) started = time;
      const elapsed = time - started;
      const fraction = Math.min(elapsed / COUNTER_DURATION, 1);
      if (elapsed - lastPaint >= 1000 / 30 || fraction === 1) {
        setProgress(1 - Math.pow(1 - fraction, 3));
        lastPaint = elapsed;
      }
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => { frame = requestAnimationFrame(tick); }, COUNTER_DELAY);
    return () => { clearTimeout(timer); if (frame !== undefined) cancelAnimationFrame(frame); };
  }, [reduced, focused]);
  return progress;
}

export default function WelcomeScreen({ navigation }) {
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 740 || width < 360 || fontScale > 1.2;
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const count = useDemoCounters(reduced, focused);
  const drift = useSharedValue(0);
  const occupancy = useSharedValue(0);
  const receipt = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(drift);
    cancelAnimation(occupancy);
    cancelAnimation(receipt);
    if (reduced || !focused) {
      drift.value = 0;
      occupancy.value = DEMO.occupancy / 100;
      receipt.value = 1;
    } else {
      occupancy.value = 0;
      receipt.value = 0;
      occupancy.value = withDelay(COUNTER_DELAY, withTiming(DEMO.occupancy / 100, { duration: COUNTER_DURATION, easing: Easing.out(Easing.cubic) }));
      receipt.value = withDelay(COUNTER_DELAY + COUNTER_DURATION, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
      drift.value = withRepeat(withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ), -1);
    }
    return () => { cancelAnimation(drift); cancelAnimation(occupancy); cancelAnimation(receipt); };
  }, [reduced, focused, drift, occupancy, receipt]);

  const cardMotion = useAnimatedStyle(() => ({ transform: [{ translateY: -drift.value * 6 }, { rotate: `${-0.6 + drift.value * 0.6}deg` }] }));
  const fill = useAnimatedStyle(() => ({ width: `${occupancy.value * 100}%` }));
  const receiptMotion = useAnimatedStyle(() => ({ opacity: receipt.value, transform: [{ translateY: (1 - receipt.value) * 14 + drift.value * 3 }, { scale: 0.92 + receipt.value * 0.08 }] }));

  return (
    <Screen scroll contentStyle={styles.page}>
      <FadeIn style={styles.header}>
        <BrandMark />
        <View style={styles.brandSpark}><Ionicons name="sparkles" size={19} color={theme.primary} /></View>
      </FadeIn>

      <View style={[styles.stage, compact && styles.stageCompact]}>
        <FadeIn delay={120} style={styles.preview}>
          <View style={styles.backCard} />
          <Animated.View
            accessible
            accessibilityLabel="Demo: Sai Residency PG. 92 percent occupied, 57 occupied beds, 5 vacant beds, 24 rooms, rent collected 1 lakh 20 thousand rupees."
            style={[styles.card, compact && styles.cardCompact, cardMotion]}
          >
            <View style={styles.cardHead}>
              <View style={styles.propertyIcon}><Ionicons name="business" size={23} color="#FFFFFF" /></View>
              <View style={styles.propertyName}><Text style={styles.name}>Sai Residency PG</Text><Text style={styles.propertyMeta}>24 rooms · 62 beds</Text></View>
              <View style={styles.demoPill}><Text style={styles.demoLabel}>Demo</Text></View>
            </View>

            <View style={styles.collectionRow}>
              <View style={styles.collection}>
                <View style={styles.collectionHeading}><Ionicons name="wallet-outline" size={15} color="#fff" /><Text style={styles.cardLabel}>Rent collected</Text></View>
                <Text style={[styles.amount, compact && styles.amountCompact]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatAmount(DEMO.collected * count)}</Text>
              </View>
              {width >= 360 && fontScale <= 1.2 && <View style={styles.chart} accessible={false} importantForAccessibility="no-hide-descendants">
                {COLLECTION_BARS.map((barHeight, index) => <CollectionBar key={index} height={barHeight} progress={occupancy} index={index} />)}
              </View>}
            </View>

            <View style={styles.occupancyPanel}>
              <View style={styles.occupancyFigure}>
                <Text style={styles.occupancyValue}>{Math.round(DEMO.occupancy * count)}<Text style={styles.percent}>%</Text></Text>
                <Text style={styles.cardLabel}>Occupancy</Text>
              </View>
              <View style={styles.occupancyDetail}>
                <View style={styles.track}><Animated.View style={[styles.fill, fill]}><View style={styles.fillHighlight} /></Animated.View></View>
                <Text style={styles.bedCaption}>{Math.round(DEMO.occupied * count)} of 62 beds filled</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <HeroStat value={Math.round(DEMO.occupied * count)} label="Occupied" icon="people-outline" delay={260} />
              <HeroStat value={Math.round(DEMO.vacant * count)} label="Vacant" icon="bed-outline" delay={340} />
              <HeroStat value={Math.round(DEMO.rooms * count)} label="Rooms" icon="business-outline" delay={420} />
            </View>
          </Animated.View>
        </FadeIn>
        <Animated.View style={[styles.receipt, receiptMotion]} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={styles.receiptCheck}><Ionicons name="checkmark" size={18} color="#267A58" /></View>
          <Text style={styles.receiptLabel}>Rent received</Text>
          <Ionicons name="sparkles" size={14} color={theme.primary} />
        </Animated.View>
      </View>

      <FadeIn delay={220} style={styles.copy}>
        <Text style={[styles.title, compact && styles.titleCompact]}>Your PG.{'\n'}<Text style={styles.accent}>Made simple.</Text></Text>
        <Text style={styles.subtitle}>Rooms, tenants and rent. All together.</Text>
      </FadeIn>
      <FadeIn delay={340} style={styles.actions}>
        <Press accessibilityRole="button" accessibilityLabel="Get started" haptics="press" onPress={() => navigation.navigate('Register')} style={styles.startButton}>
          <Text style={styles.startLabel}>Get started</Text>
          <View style={styles.arrowTile}><Ionicons name="arrow-forward" size={21} color="#fff" /></View>
        </Press>
        <Press accessibilityRole="button" accessibilityLabel="Sign in" onPress={() => navigation.navigate('Login')} style={styles.signIn}><Text style={styles.signInLabel}>Sign in</Text></Press>
      </FadeIn>
    </Screen>
  );
}

function HeroStat({ value, label, icon, delay }) {
  return <FadeIn delay={delay} style={styles.stat}><View style={styles.statFigure}><Ionicons name={icon} size={16} color={theme.primaryText} /><Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View><Text style={styles.statLabel}>{label}</Text></FadeIn>;
}

function CollectionBar({ height, progress, index }) {
  const animated = useAnimatedStyle(() => ({ height: 8 + (progress.value / (DEMO.occupancy / 100)) * (height - 8) }));
  return <Animated.View style={[styles.chartBar, { backgroundColor: index === COLLECTION_BARS.length - 1 ? '#BCEFD8' : 'rgba(255,255,255,0.35)' }, animated]} />;
}

const styles = StyleSheet.create({
  page: { maxWidth: 600, gap: 20, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandSpark: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#EEE8FC', alignItems: 'center', justifyContent: 'center' },
  stage: { flexGrow: 1, minHeight: 390, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  stageCompact: { minHeight: 370 },
  preview: { width: '100%', maxWidth: 400, paddingHorizontal: 6 },
  backCard: { position: 'absolute', left: 16, right: 8, top: 4, bottom: 6, borderRadius: 30, backgroundColor: theme.primaryTint, transform: [{ rotate: '2.5deg' }] },
  card: { backgroundColor: theme.primary, borderRadius: 28, borderWidth: 1, borderColor: theme.primary, padding: 20, gap: 16, overflow: 'hidden', ...shadow.lift },
  cardCompact: { padding: 18, gap: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.18)' },
  propertyIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  propertyName: { flex: 1, minWidth: 0 },
  name: { ...typography.bodyStrong, fontSize: 14, color: '#fff' },
  propertyMeta: { ...typography.caption, fontSize: 10, color: '#FFFFFF', marginTop: 4 },
  demoPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  demoLabel: { ...typography.caption, fontSize: 9, color: '#FFFFFF' },
  occupancyPanel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  occupancyFigure: { gap: 3 },
  occupancyDetail: { flex: 1, minWidth: 110, gap: 10 },
  bedCaption: { ...typography.caption, fontSize: 10, color: '#fff' },
  cardLabel: { ...typography.caption, color: '#FFFFFF' },
  occupancyValue: { ...typography.display, fontSize: 36, lineHeight: 40, color: '#fff', fontVariant: ['tabular-nums'] },
  percent: { fontSize: 19, color: '#FFFFFF' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#A9DFC9', overflow: 'hidden' },
  fillHighlight: { position: 'absolute', right: 0, width: 20, height: '100%', borderRadius: 4, backgroundColor: '#D5F4E6' },
  collectionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  collection: { flex: 1, minWidth: 0, gap: 8 },
  chart: { height: 60, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  chartBar: { width: 6, borderRadius: 3 },
  collectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { ...typography.display, fontSize: 36, lineHeight: 42, color: '#fff', fontVariant: ['tabular-nums'] },
  amountCompact: { fontSize: 32, lineHeight: 38 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, minWidth: 0, gap: 4, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 10 },
  statFigure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { ...typography.h2, fontSize: 24, color: theme.text, fontVariant: ['tabular-nums'] },
  statLabel: { ...typography.caption, fontSize: 10, color: theme.textMuted },
  receipt: { alignSelf: 'flex-end', marginRight: 10, marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingRight: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEE7F6', ...shadow.lift },
  receiptCheck: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#E1F3EA', alignItems: 'center', justifyContent: 'center' },
  receiptLabel: { ...typography.label, fontSize: 12, color: theme.text },
  copy: { gap: 12, alignItems: 'center' },
  title: { ...typography.display, fontSize: 42, lineHeight: 46, letterSpacing: -1.4, color: theme.text, textAlign: 'center' },
  titleCompact: { fontSize: 38, lineHeight: 42 },
  accent: { color: theme.primary },
  subtitle: { ...typography.small, color: theme.textMuted, textAlign: 'center' },
  actions: { gap: 8, marginTop: 'auto', paddingTop: 8 },
  startButton: { minHeight: 64, borderRadius: 22, paddingLeft: 26, paddingRight: 10, paddingVertical: 10, backgroundColor: theme.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, ...shadow.card },
  startLabel: { fontFamily: fonts.semibold, fontSize: 16, color: '#fff', flexShrink: 1 },
  arrowTile: { width: 44, height: 44, borderRadius: 15, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  signIn: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  signInLabel: { ...typography.small, fontFamily: fonts.semibold, color: theme.primaryText },
});
