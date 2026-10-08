import React, { useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Notice, PageHeader, QueryState, Row, Screen, SectionTitle, theme, typography } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { ChoiceField, FinanceLine, MonthPicker } from '../components/FinanceControls';
import { useAuth } from '../context/AuthContext';
import { STAFF_ROLES, PAYMENT_METHODS, currentFinanceMonth, labelOf, moneyPaise, paise, paymentDate, rupeeInput, submissionId, todayIST, workDays } from '../lib/finance';

export default function FinanceStaffDetailScreen({ route }) {
  const { api } = useAuth();
  const { propertyId, staffId } = route.params;
  const cache = useQueryClient();
  const [month, setMonth] = useState(route.params.month || currentFinanceMonth());
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const params = { propertyId, month };
  const path = `/finance/staff/${staffId}`;
  const query = useQuery({ queryKey: ['financeStaffDetail', propertyId, staffId, month], queryFn: async () => (await api.get(path, { params })).data.data });
  const s = query.data;
  const period = s?.period;
  const rate = s?.rateForMonth;
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  const open = value => { setError(''); setForm(value); };
  async function refresh() {
    await Promise.all([cache.invalidateQueries({ queryKey: ['financeStaff', propertyId] }), cache.invalidateQueries({ queryKey: ['financeStaffDetail', propertyId, staffId] }), cache.invalidateQueries({ queryKey: ['financeReport', propertyId] })]);
  }
  async function save() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (form.kind === 'edit') {
        const body = { revision: s.revision, name: form.name.trim(), phone: form.phone.trim(), role: form.role, notes: form.notes.trim() };
        if (form.paymentType !== s.paymentType || paise(form.rate) !== s.ratePaise) Object.assign(body, { paymentType: form.paymentType, ratePaise: paise(form.rate), effectiveMonth: form.effectiveMonth });
        await api.patch(path, body, { params });
      } else if (form.kind === 'period') {
        await api.post(`${path}/periods`, rate?.paymentType === 'DAILY' ? { daysWorked: workDays(form.daysWorked) } : {}, { params });
      } else if (form.kind === 'days') {
        await api.patch(`${path}/periods`, { revision: period.revision, daysWorked: workDays(form.daysWorked), correctionReason: form.reason.trim() }, { params });
      } else {
        await api.post(`${path}/payments`, { clientId: form.clientId, type: form.type, amountPaise: paise(form.amount), date: paymentDate(form.date), method: form.method, note: form.note.trim() }, { params });
      }
      setForm(null); await refresh();
    } catch (e) { setError(e.response?.data?.message || e.message || 'Could not save.'); }
    finally { setBusy(false); }
  }
  function changeStatus() {
    const status = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    Alert.alert(status === 'INACTIVE' ? 'Mark staff inactive?' : 'Reactivate staff?', 'Recorded salaries and payment history will remain available.', [
      { text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: async () => {
        if (busy) return;
        try { setBusy(true); setError(''); await api.patch(path, { revision: s.revision, status }, { params }); await refresh(); }
        catch (e) { setError(e.response?.data?.message || 'Could not update staff.'); }
        finally { setBusy(false); }
      } },
    ]);
  }
  return <Screen scroll edges={['left', 'right']} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}>
    <PageHeader title={s?.name || 'Staff details'} subtitle={s ? `${labelOf(STAFF_ROLES, s.role)} · ${s.phone} · ${s.status === 'ACTIVE' ? 'Active' : 'Inactive'}\nJoined ${s.joinedDate}` : undefined} />
    {!form && <Notice message={error} />}
    <MonthPicker month={month} onChange={setMonth} disabled={busy} />
    <QueryState query={query}>
      {s && <>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button size="sm" variant="secondary" disabled={busy} onPress={() => open({ kind: 'edit', name: s.name, phone: s.phone, role: s.role, paymentType: s.paymentType, rate: rupeeInput(s.ratePaise), effectiveMonth: currentFinanceMonth(), notes: s.notes || '' })}>Edit staff</Button>
          <Button size="sm" variant="tertiary" disabled={busy} onPress={changeStatus}>{s.status === 'ACTIVE' ? 'Mark inactive' : 'Reactivate'}</Button>
        </View>
        <Card>
          <FinanceLine label={period?.paymentType === 'DAILY' || (!period && rate?.paymentType === 'DAILY') ? 'Daily rate' : 'Monthly salary'} value={moneyPaise(period?.ratePaise ?? rate?.ratePaise ?? 0)} />
          {period ? <>
            {period.paymentType === 'DAILY' && <FinanceLine label="Days worked" value={String(period.daysWorked)} />}
            <FinanceLine label="Earned" value={moneyPaise(period.earnedPaise)} />
            <FinanceLine label="Paid" value={moneyPaise(period.paidPaise)} />
            <FinanceLine label="Pending" value={moneyPaise(period.earnedPaise - period.paidPaise)} strong />
          </> : <Text style={{ ...typography.small, color: theme.textMuted, marginTop: 8 }}>Salary / days worked have not been recorded for this month.</Text>}
        </Card>
        {!period && rate && month <= currentFinanceMonth() && <Button disabled={busy} onPress={() => open({ kind: 'period', daysWorked: '' })}>{rate.paymentType === 'DAILY' ? 'Enter days worked' : 'Record monthly salary'}</Button>}
        {period && period.paymentType === 'DAILY' && <Button variant="secondary" disabled={busy} onPress={() => open({ kind: 'days', daysWorked: String(period.daysWorked), reason: '' })}>Edit days worked</Button>}
        {period && period.earnedPaise > period.paidPaise && <Button disabled={busy} onPress={() => open({ kind: 'payment', clientId: submissionId(), type: period.paymentType === 'DAILY' ? 'WAGE' : 'SALARY', amount: rupeeInput(period.earnedPaise - period.paidPaise), date: todayIST(), method: 'CASH', note: '' })}>Record payment / advance</Button>}
        <SectionTitle>Payment history</SectionTitle>
        {!s.payments?.length && <Text style={{ ...typography.small, color: theme.textMuted }}>No payments recorded for this period.</Text>}
        {(s.payments || []).map(payment => <Row key={payment._id} icon="wallet-outline" title={payment.type === 'ADVANCE' ? 'Advance' : payment.type === 'WAGE' ? 'Wage payment' : 'Salary payment'} right={moneyPaise(payment.amountPaise)}
          subtitle={`${new Date(payment.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · ${labelOf(PAYMENT_METHODS, payment.method)}${payment.note ? ` · ${payment.note}` : ''}`} />)}
        {!!s.notes && <Text style={{ ...typography.small, color: theme.textMuted }}>{s.notes}</Text>}
      </>}
    </QueryState>
    <Sheet visible={!!form} onClose={() => !busy && setForm(null)} title={form?.kind === 'edit' ? 'Edit staff' : form?.kind === 'payment' ? 'Record payment' : form?.kind === 'days' ? 'Correct days worked' : 'Record salary period'}>
      {form && <>
        <Notice message={error} />
        {form.kind === 'edit' ? <>
          <Field label="Name" value={form.name} onChangeText={set('name')} />
          <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <ChoiceField label="Role" options={STAFF_ROLES} value={form.role} onChange={set('role')} />
          <ChoiceField label="Payment type" options={[{ label: 'Monthly', value: 'MONTHLY' }, { label: 'Daily', value: 'DAILY' }]} value={form.paymentType} onChange={set('paymentType')} />
          <Field label="Rate (₹)" value={form.rate} onChangeText={set('rate')} keyboardType="decimal-pad" />
          <Field label="Rate effective month" value={form.effectiveMonth} onChangeText={set('effectiveMonth')} placeholder="YYYY-MM" hint="Existing salary periods keep their recorded rate." />
          <Field label="Notes" value={form.notes} onChangeText={set('notes')} />
        </> : form.kind === 'payment' ? <>
          <ChoiceField label="Payment type" options={[{ label: 'Advance', value: 'ADVANCE' }, { label: period?.paymentType === 'DAILY' ? 'Wage payment' : 'Salary payment', value: period?.paymentType === 'DAILY' ? 'WAGE' : 'SALARY' }]} value={form.type} onChange={set('type')} />
          <Field label="Amount (₹)" value={form.amount} onChangeText={set('amount')} keyboardType="decimal-pad" />
          <Field label="Payment date" value={form.date} onChangeText={set('date')} placeholder="YYYY-MM-DD" />
          <ChoiceField label="Payment method" options={PAYMENT_METHODS} value={form.method} onChange={set('method')} />
          <Field label="Note (optional)" value={form.note} onChangeText={set('note')} />
        </> : <>
          {(form.kind === 'days' || rate?.paymentType === 'DAILY') && <Field label="Days worked" value={form.daysWorked} onChangeText={set('daysWorked')} keyboardType="number-pad" />}
          {form.kind === 'days' && <Field label="Correction reason" value={form.reason} onChangeText={set('reason')} />}
          {form.kind === 'period' && rate?.paymentType === 'MONTHLY' && <FinanceLine label="Recorded monthly salary" value={moneyPaise(rate.ratePaise)} />}
        </>}
        <Button loading={busy} onPress={save}>Save</Button>
      </>}
    </Sheet>
  </Screen>;
}
