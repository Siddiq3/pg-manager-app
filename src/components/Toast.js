import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts, shadow, theme, typography } from './tokens';

const ToastContext = createContext(null);
const noop = { show: () => {}, success: () => {}, error: () => {}, info: () => {} };

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((message, tone = 'info') => {
    if (!message) return;
    clearTimeout(timer.current);
    setToast({ message: String(message), tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  const value = useMemo(() => ({
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  }), [show]);
  return <ToastContext.Provider value={value}>{children}{toast ? <Toast key={toast.key} message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext) || noop;

function Toast({ message, tone, onClose }) {
  const insets = useSafeAreaInsets();
  const palette = tone === 'success'
    ? [theme.okWeak, theme.ok]
    : tone === 'error' ? [theme.dangerWeak, theme.danger] : [theme.surface, theme.text];
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Pressable accessibilityRole="alert" onPress={onClose} style={[styles.toast, { backgroundColor: palette[0] }]}>
        <Ionicons name={tone === 'success' ? 'checkmark-circle' : tone === 'error' ? 'alert-circle' : 'information-circle'} size={20} color={palette[1]} />
        <Text style={[styles.text, { color: palette[1] }]} numberOfLines={3}>{message}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 9999 },
  toast: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow.lift },
  text: { ...typography.small, fontFamily: fonts.semibold, flex: 1 },
});