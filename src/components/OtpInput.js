import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, theme, radius, spacing } from './tokens';

/**
 * Six boxes are a picture of one hidden TextInput, so paste, backspace and the OS's
 * one-time-code suggestion all work.
 */
export function OtpInput({ value = '', onChangeText, length = 6 }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code">
      <View style={s.row}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={[s.box, value[i] && s.filled, focused && i === active && s.active]}>
            <Text style={s.digit}>{value[i] || ''}</Text>
          </View>
        ))}
      </View>
      <TextInput ref={ref} value={value} onChangeText={(v) => onChangeText(v.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={length} caretHidden style={s.hidden} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  box: { flex: 1, height: 62, borderWidth: 1.5, borderColor: theme.borderStrong, borderRadius: radius.md, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  filled: { backgroundColor: theme.primarySubtle },
  active: { borderColor: theme.primary },
  digit: { fontFamily: fonts.display, fontSize: 27, letterSpacing: -0.5, color: theme.text },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
