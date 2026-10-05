import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { theme } from './tokens';

export function Skeleton({ width = '100%', height = 12, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.42, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.border, opacity }, style]} />;
}

export function SkeletonRow() {
  return <View style={styles.row}><Skeleton width={42} height={42} radius={21} /><View style={styles.body}><Skeleton width="58%" /><Skeleton width="36%" height={10} /></View></View>;
}

export function SkeletonScreen({ rows = 4 }) {
  return <View style={styles.screen}><Skeleton width="42%" height={13} /><Skeleton width="68%" height={28} style={{ marginTop: 8, marginBottom: 24 }} />{Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}</View>;
}

const styles = StyleSheet.create({
  screen: { gap: 12, paddingVertical: 4 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle },
  body: { flex: 1, gap: 10 },
});