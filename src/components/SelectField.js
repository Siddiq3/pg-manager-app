import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Press, radius, theme, typography } from './ui';
import { Sheet } from './Sheet';

export function SelectField({ label, value, options, onChange, editable = true, optional = true, maxLength = 80 }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState('');
  const selected = options.find(option => option.value === value);
  const display = selected?.label || value || 'Not specified';
  function choose(next) {
    if (!editable) return;
    onChange(next); setOpen(false);
  }
  return <View style={{ gap: 8 }}>
    <Text style={s.label}>{label}</Text>
    <Press accessibilityRole="button" accessibilityLabel={`${label}: ${display}`} accessibilityHint="Open choices" accessibilityState={{ disabled: !editable }} disabled={!editable}
      onPress={() => { Keyboard.dismiss(); setCustom(false); setDraft(selected ? '' : value || ''); setOpen(true); }} style={[s.input, !editable && s.disabled]}>
      <Text style={s.value}>{display}</Text><Ionicons name="chevron-down" size={20} color={theme.primary} />
    </Press>
    <Sheet visible={open && editable} title={label} onClose={() => setOpen(false)}>
      {custom ? <>
        <Field label={label} value={draft} onChangeText={setDraft} placeholder={`Enter ${label.toLowerCase()}`} maxLength={maxLength} autoCapitalize="sentences" />
        <Button disabled={!draft.trim()} onPress={() => choose(draft.trim())}>Use this value</Button>
        <Button variant="tertiary" onPress={() => setCustom(false)}>Back to choices</Button>
      </> : <View>
        {(optional ? [{ label: 'Not specified', value: '' }, ...options] : options).map(option => <Press key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: option.value === value }} onPress={() => choose(option.value)} style={[s.option, option.value === value && s.selected]}>
          <Text style={s.value}>{option.label}</Text>{option.value === value && <Ionicons name="checkmark" size={20} color={theme.primary} />}
        </Press>)}
        <Press accessibilityRole="button" accessibilityLabel="Other" onPress={() => setCustom(true)} style={s.option}><Text style={s.value}>Other…</Text><Ionicons name="chevron-forward" size={18} color={theme.primary} /></Press>
      </View>}
    </Sheet>
  </View>;
}

const s = StyleSheet.create({
  label: { ...typography.label, color: theme.textSecondary },
  input: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.borderStrong, borderRadius: radius.md, backgroundColor: theme.surface, paddingHorizontal: 16, paddingVertical: 12 },
  value: { ...typography.body, color: theme.text, flex: 1 }, disabled: { backgroundColor: theme.surfaceMuted, opacity: 0.7 },
  option: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md },
  selected: { backgroundColor: theme.primarySubtle },
});
