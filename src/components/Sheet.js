import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, radius, shadow, spacing, typography } from './tokens';
import { Press } from './motion';

export function Sheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
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
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,16,20,.38)' },
  sheet: { maxHeight: '86%', backgroundColor: theme.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.sheet },
  handle: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: theme.borderStrong, marginTop: 10 },
  head: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.xl, paddingRight: spacing.md },
  title: { ...typography.h2, color: theme.text, flex: 1 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.lg },
});
