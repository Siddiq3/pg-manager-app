import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Notice, PageHeader, QueryState, Row, Screen, StateView } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { MonthPicker, ChoiceField } from '../components/FinanceControls';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/format';
import { STAFF_ROLES, currentFinanceMonth, labelOf, moneyPaise, paise, submissionId, todayIST } from '../lib/finance';

export default function FinanceStaffScreen({ navigation, route }) {
  const { api } = useAuth();
  const { propertyId, paymentsMode } = route.params;
  const cache = useQueryClient();
  const [month, setMonth] = useState(currentFinanceMonth());
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ['financeStaff', propertyId, month], queryFn: async () => (await api.get('/finance/staff', { params: { propertyId, month } })).data.data });
  const shown = (query.data || []).filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()));
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  async function save() {
    if (busy) return;
    try {
      setBusy(true); setError('');
      await api.post('/finance/staff', { clientId: form.clientId, name: form.name.trim(), phone: form.phone.trim(), role: form.role, joinedDate: form.joinedDate, paymentType: form.paymentType, ratePaise: paise(form.rate), notes: form.notes.trim() }, { params: { propertyId, month } });
      setForm(null); await cache.invalidateQueries({ queryKey: ['financeStaff', propertyId] });
    } catch (e) { setError(e.response?.data?.message || e.message || errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <Screen scroll edges={['left', 'right']} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}>
    <PageHeader title={paymentsMode ? 'Staff payments' : 'Staff'} right={<Button size="sm" onPress={() => { setError(''); setForm({ clientId: submissionId(), name: '', phone: '', role: 'COOK', joinedDate: todayIST(), paymentType: 'MONTHLY', rate: '', notes: '' }); }}>Add staff</Button>} />
    <MonthPicker month={month} onChange={setMonth} />
    <Field label="Search staff" placeholder="Search by name" value={search} onChangeText={setSearch} />
    <QueryState query={query}>
      {!shown.length ? <StateView title={search ? 'No matches' : 'No staff yet'} message="Add your cook, cleaner or helper to record payments." icon="people-outline" /> : shown.map(s => {
        const rate = s.rateForMonth;
        const summary = s.period ? `${s.period.paymentType === 'DAILY' ? `${s.period.daysWorked} days · Earned ${moneyPaise(s.period.earnedPaise)} · ` : ''}Paid ${moneyPaise(s.period.paidPaise)} · Pending ${moneyPaise(s.period.earnedPaise - s.period.paidPaise)}` : 'Salary / days worked not recorded for this month';
        return <Row key={s._id} icon="person-outline" title={s.name} subtitleLines={5} badge={s.status === 'INACTIVE' ? 'INACTIVE' : undefined}
          subtitle={`${labelOf(STAFF_ROLES, s.role)}${rate ? ` · ${moneyPaise(rate.ratePaise)}/${rate.paymentType === 'DAILY' ? 'day' : 'month'}` : ''}\n${summary}`}
          onPress={() => navigation.navigate('FinanceStaffDetail', { propertyId, staffId: s._id, month })} />;
      })}
    </QueryState>
    <Sheet visible={!!form} onClose={() => !busy && setForm(null)} title="Add staff">
      {form && <>
        <Notice message={error} />
        <Field label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <ChoiceField label="Role" options={STAFF_ROLES} value={form.role} onChange={set('role')} />
        <Field label="Joining date" value={form.joinedDate} onChangeText={set('joinedDate')} placeholder="YYYY-MM-DD" />
        <ChoiceField label="Payment type" options={[{ label: 'Monthly salary', value: 'MONTHLY' }, { label: 'Daily wage', value: 'DAILY' }]} value={form.paymentType} onChange={set('paymentType')} />
        <Field label={form.paymentType === 'MONTHLY' ? 'Monthly salary (₹)' : 'Daily rate (₹)'} value={form.rate} onChangeText={set('rate')} keyboardType="decimal-pad" />
        <Field label="Notes (optional)" value={form.notes} onChangeText={set('notes')} />
        <Button loading={busy} onPress={save}>Save staff</Button>
      </>}
    </Sheet>
  </Screen>;
}
