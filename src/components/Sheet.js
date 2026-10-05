import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, radius, shadow, spacing, typography } from './tokens';
import { Press } from './motion';

/** Android keyboard height, so the sheet can sit above it (iOS uses KeyboardAvoidingView). */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const show = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
}

/**
 * The Modal's root is sized to the window explicitly. With only flex and a percentage
 * maxHeight, the root can lay out at zero size on Android: the sheet then never appears.
 */
export function Sheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const maxHeight = Math.min(height * 0.86, height - keyboard - insets.top - spacing.lg);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={[s.root, { width, height: height - keyboard }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { maxHeight, paddingBottom: keyboard ? spacing.md : Math.max(insets.bottom, spacing.lg) }]}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>{title}</Text>
            <Press onPress={onClose} accessibilityLabel="Close" style={s.close}><Ionicons name="close" size={20} color={theme.text} /></Press>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,16,20,.38)' },
  sheet: { backgroundColor: theme.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.sheet },
  handle: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: theme.borderStrong, marginTop: 10 },
  head: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.xl, paddingRight: spacing.md },
  title: { ...typography.h2, color: theme.text, flex: 1 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.lg },
});
