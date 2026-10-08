import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from './motion';
import { fonts, theme } from './tokens';

/** Small scenes for the four account questions. */
export default function SignupIllustration({ step, icon, name }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = reduced ? 0 : withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(float);
  }, [reduced, float]);
  const main = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : -7 * float.value }, { rotate: `${reduced ? 0 : (float.value - 0.5) * 3}deg` }] }));
  const badge = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : 5 * float.value }, { scale: reduced ? 1 : 1 + float.value * 0.04 }] }));
  return <View style={styles.scene} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={styles.halo} />
    <View style={styles.dotOne} /><View style={styles.dotTwo} />
    <Animated.View style={[styles.tile, step === 2 && styles.phone, main]}>
      {step === 1 ? <View style={styles.avatar}><Text style={styles.initial}>{name.trim().slice(0, 1).toUpperCase() || 'YOU'}</Text></View> : <Ionicons name={icon} size={step === 3 ? 64 : 56} color={theme.primaryText} />}
      {step === 2 && <View style={styles.phoneLine} />}
      {step === 1 && <View style={styles.profileLine} />}
    </Animated.View>
    <Animated.View style={[styles.badge, badge]}><Ionicons name={step === 0 ? 'paper-plane' : step === 2 ? 'chatbubble-ellipses' : 'checkmark'} size={23} color={step === 0 || step === 2 ? theme.primaryText : theme.success} /></Animated.View>
    <View style={styles.spark}><Ionicons name="sparkles" size={22} color={theme.primary} /></View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  halo: { width: 168, height: 168, borderRadius: 84, backgroundColor: theme.primarySubtle, position: 'absolute' },
  tile: { width: 128, height: 112, borderRadius: 28, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center', gap: 12 },
  phone: { width: 88, height: 134, borderRadius: 24, borderWidth: 3 },
  phoneLine: { width: 26, height: 4, borderRadius: 2, backgroundColor: theme.primaryTint },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display, fontSize: 23, color: theme.primaryText },
  profileLine: { width: 54, height: 5, borderRadius: 3, backgroundColor: theme.primaryTint },
  badge: { position: 'absolute', marginLeft: 125, marginTop: 78, width: 48, height: 48, borderRadius: 17, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute', marginLeft: -139, marginTop: -95 },
  dotOne: { position: 'absolute', marginLeft: 176, marginTop: -72, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.primaryTint },
  dotTwo: { position: 'absolute', marginLeft: -174, marginTop: 80, width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary },
});
