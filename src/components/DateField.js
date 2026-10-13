import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Press, radius, theme, typography } from './ui';
import { Sheet } from './Sheet';
import { calendarDays, dateLabel, MONTH_NAMES, validDay } from '../lib/calendar';
import { shiftMonth, todayIST } from '../lib/finance';

/** Calendar selection preserves the date-only API value, including optional blanks. */
export function DateField({ label, value, onChange, editable = true, disabled = false, optional = false, error, hint, mode = 'date', minDate = '1900-01-01', maxDate = '2100-12-31' }) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const [month, setMonth] = useState(todayIST().slice(0, 7));
  const [view, setView] = useState('days');
  const [yearPage, setYearPage] = useState(2000);
  const monthOnly = mode === 'month';
  const locked = disabled || !editable;
  const minMonth = minDate.slice(0, 7), maxMonth = maxDate.slice(0, 7);
  const year = Number(month.slice(0, 4));
  const inRange = day => day >= minDate && day <= maxDate;
  const monthAllowed = item => item >= minMonth && item <= maxMonth;
  const validDraft = monthOnly ? monthAllowed(draft) && /^\d{4}-\d{2}$/.test(draft) : validDay(draft) && inRange(draft);
  function open() {
    if (locked) return;
    Keyboard.dismiss();
    const initial = monthOnly ? (value ? `${value}-01` : todayIST()) : (validDay(value) ? value : todayIST());
    const bounded = initial < minDate ? minDate : initial > maxDate ? maxDate : initial;
    setDraft(value || (monthOnly ? bounded.slice(0, 7) : bounded));
    setMonth(bounded.slice(0, 7));
    setYearPage(Math.floor(Number(bounded.slice(0, 4)) / 12) * 12);
    setView(monthOnly ? 'months' : 'days');
    setVisible(true);
  }
  function chooseMonth(item) {
    setMonth(item);
    if (monthOnly) setDraft(item);
    else setView('days');
  }
  function commit(next) {
    if (locked) return;
    onChange(next);
    setVisible(false);
  }
  return <View style={s.field}>
    {!!label && <Text style={s.label}>{label}</Text>}
    <Press accessibilityRole="button" accessibilityLabel={`${label || 'Month'}: ${dateLabel(value, monthOnly) || 'Select date'}`} accessibilityHint={error || hint || (monthOnly ? 'Open month picker' : 'Open calendar')} accessibilityState={{ disabled: locked }} disabled={locked} onPress={open}
      style={[s.input, locked && s.locked, error && { borderColor: theme.error }]}>
      <Text style={[s.value, !value && { color: theme.textMuted }]}>{dateLabel(value, monthOnly) || (monthOnly ? 'Select month' : 'Select date')}</Text>
      <Ionicons name="calendar-outline" size={20} color={locked ? theme.textDisabled : theme.primary} />
    </Press>
    {!!(error || hint) && <Text style={[s.hint, error && { color: theme.error }]}>{error || hint}</Text>}
    <Sheet visible={visible && !locked} title={label || 'Select month'} onClose={() => setVisible(false)}>
      <View style={s.navigation}>
        <Button size="sm" variant="secondary" accessibilityLabel={view === 'days' ? 'Previous month' : view === 'months' ? 'Previous year' : 'Earlier years'}
          disabled={view === 'days' ? month <= minMonth : view === 'months' ? year <= Number(minDate.slice(0, 4)) : yearPage <= Number(minDate.slice(0, 4))}
          onPress={() => view === 'days' ? setMonth(shiftMonth(month, -1)) : view === 'months' ? setMonth(`${year - 1}-${month.slice(5)}`) : setYearPage(yearPage - 12)}>‹</Button>
        <Press accessibilityRole="button" accessibilityLabel={view === 'days' ? 'Choose month and year' : 'Choose year'} style={s.heading}
          onPress={() => { setYearPage(Math.floor(year / 12) * 12); setView(view === 'days' ? 'months' : 'years'); }}>
          <Text style={s.headingText}>{view === 'days' ? dateLabel(month, true) : view === 'months' ? String(year) : `${yearPage}–${yearPage + 11}`}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.primary} />
        </Press>
        <Button size="sm" variant="secondary" accessibilityLabel={view === 'days' ? 'Next month' : view === 'months' ? 'Next year' : 'Later years'}
          disabled={view === 'days' ? month >= maxMonth : view === 'months' ? year >= Number(maxDate.slice(0, 4)) : yearPage + 11 >= Number(maxDate.slice(0, 4))}
          onPress={() => view === 'days' ? setMonth(shiftMonth(month, 1)) : view === 'months' ? setMonth(`${year + 1}-${month.slice(5)}`) : setYearPage(yearPage + 12)}>›</Button>
      </View>
      {view === 'days' ? <View>
        <View style={s.grid}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <Text key={day} style={s.weekday}>{day}</Text>)}</View>
        <View style={s.grid}>{calendarDays(month).map((day, i) => day ? <Press key={day} accessibilityRole="button" accessibilityLabel={dateLabel(day)} accessibilityState={{ selected: draft === day, disabled: !inRange(day) }}
          disabled={!inRange(day)} onPress={() => setDraft(day)} style={[s.day, draft === day && s.selected]}>
          <Text style={[s.dayText, day === todayIST() && { color: theme.primary }, !inRange(day) && { color: theme.textDisabled }, draft === day && s.selectedText]}>{Number(day.slice(8))}</Text>
        </Press> : <View key={`blank-${i}`} style={s.day} />)}</View>
      </View> : <View style={s.grid}>
        {(view === 'months' ? MONTH_NAMES : Array.from({ length: 12 }, (_, i) => yearPage + i)).map((item, i) => {
          const candidate = view === 'months' ? `${year}-${String(i + 1).padStart(2, '0')}` : String(item);
          const allowed = view === 'months' ? monthAllowed(candidate) : item >= Number(minDate.slice(0, 4)) && item <= Number(maxDate.slice(0, 4));
          const selected = view === 'months' ? (monthOnly ? draft : month) === candidate : year === item;
          return <Press key={item} accessibilityRole="button" accessibilityLabel={String(item)} accessibilityState={{ selected, disabled: !allowed }} disabled={!allowed}
            onPress={() => {
              if (view === 'months') chooseMonth(candidate);
              else { setMonth(`${item}-${month.slice(5)}`); setView('months'); }
            }} style={[s.choice, selected && s.selected]}>
            <Text style={[s.dayText, !allowed && { color: theme.textDisabled }, selected && s.selectedText]}>{view === 'months' ? item.slice(0, 3) : item}</Text>
          </Press>;
        })}
      </View>}
      <Text style={s.summary}>{dateLabel(draft, monthOnly) || 'No date selected'}</Text>
      <Button disabled={!validDraft} onPress={() => commit(draft)}>{monthOnly ? 'Use this month' : 'Use this date'}</Button>
      {optional && !!value && <Button variant="tertiary" onPress={() => commit('')}>Clear date</Button>}
    </Sheet>
  </View>;
}

const s = StyleSheet.create({
  field: { gap: 8 }, label: { ...typography.label, color: theme.textSecondary },
  input: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 10 },
  locked: { backgroundColor: theme.surfaceMuted, opacity: 0.7 }, value: { ...typography.body, color: theme.text, flex: 1 }, hint: { ...typography.small, color: theme.textMuted },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: 8 }, heading: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, headingText: { ...typography.bodyStrong, color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', ...typography.small, color: theme.textMuted, paddingVertical: 8 },
  day: { width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingVertical: 10 },
  choice: { width: '33.3333%', minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingVertical: 12 },
  dayText: { ...typography.label, color: theme.text }, selected: { backgroundColor: theme.primary }, selectedText: { color: '#fff' }, summary: { ...typography.bodyStrong, color: theme.primaryText, textAlign: 'center' },
});
