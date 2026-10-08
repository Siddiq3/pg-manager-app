import React from 'react';
import { Text, View } from 'react-native';
import { Button, Press, theme, typography } from './ui';
import { monthLabel } from '../lib/format';
import { shiftMonth } from '../lib/finance';

export function MonthPicker({ month, onChange, disabled }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <Button size="sm" variant="secondary" disabled={disabled || month <= '2000-01'} accessibilityLabel="Previous month" onPress={() => onChange(shiftMonth(month, -1))}>‹</Button>
    <Text style={{ ...typography.bodyStrong, color: theme.text, flex: 1, textAlign: 'center' }}>{monthLabel(month)}</Text>
    <Button size="sm" variant="secondary" disabled={disabled || month >= '2099-12'} accessibilityLabel="Next month" onPress={() => onChange(shiftMonth(month, 1))}>›</Button>
  </View>;
}
export function ChoiceField({ label, options, value, onChange, disabled = false }) {
  return <View style={{ gap: 8 }}><Text style={{ ...typography.label, color: theme.textSecondary }}>{label}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {options.map(option => <Press key={String(option.value)} disabled={disabled} onPress={() => onChange(option.value)} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} accessibilityLabel={`${label}: ${option.label}`}
      style={{ borderRadius: 10, borderWidth: 1, borderColor: value === option.value ? theme.primary : theme.border, backgroundColor: value === option.value ? theme.primarySubtle : theme.surface, paddingHorizontal: 12, paddingVertical: 12 }}>
      <Text style={{ ...typography.label, color: value === option.value ? theme.primaryText : theme.textSecondary }}>{option.label}</Text>
    </Press>)}
  </View></View>;
}
export function FinanceLine({ label, value, strong = false }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}><Text style={{ ...(strong ? typography.bodyStrong : typography.body), color: theme.text, flex: 1 }}>{label}</Text><Text style={{ ...(strong ? typography.bodyStrong : typography.body), color: theme.text, fontVariant: ['tabular-nums'] }}>{value}</Text></View>;
}
