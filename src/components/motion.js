import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from './tokens';

/** Respect the OS setting before enabling motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buzz = (kind) => {
  try {
    if (kind === 'select') Haptics.selectionAsync().catch(() => {});
    else Haptics.impactAsync(kind === 'press' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
};

/** A pressable that scales slightly and taps the haptic engine, so every control feels physical. */
export function Press({ children, onPress, disabled, style, haptics = 'tap', scaleTo = 0.975, ...rest }) {
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: reduced ? 1 : 1 - (1 - scaleTo) * p.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { p.value = withTiming(1, { duration: 90 }); if (!disabled && haptics) buzz(haptics); }}
      onPressOut={() => { p.value = withTiming(0, { duration: motion.fast }); }}
      style={[style, animated, disabled && { opacity: 0.45 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function FadeIn({ children, delay = 0, style }) {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const id = setTimeout(() => { v.value = withTiming(1, { duration: reduced ? 0 : motion.base }); }, reduced ? 0 : delay);
    return () => clearTimeout(id);
  }, [reduced, delay, v]);
  const a = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: reduced ? 0 : (1 - v.value) * 12 }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

export { Animated };
