import React, { useState } from 'react';
import { RefreshControl, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Notice, PageHeader, QueryState, Row, Screen, StateView, theme, typography } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { ChoiceField, FinanceLine, MonthPicker } from '../components/FinanceControls';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, currentFinanceMonth, labelOf, moneyPaise, paise, paymentDate, rupeeInput, submissionId, todayIST } from '../lib/finance';

export default function FinanceExpensesScreen({ route }) {
  const { api } = useAuth();
  const { propertyId } = route.params;
  const cache = useQueryClient();
  const [month, setMonth] = useState(currentFinanceMonth());
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const params = { propertyId, month };
  const query = useQuery({ queryKey: ['financeExpenses', propertyId, month], queryFn: async () => (await api.get('/finance/expenses', { params })).data.data });
  const all = query.data || [];
  const shown = all.filter(e => (category === 'ALL' || e.category === category) && (status === 'ALL' ? e.status !== 'VOID' : e.status === status));
  const totals = EXPENSE_CATEGORIES.map(c => ({ ...c, total: shown.filter(e => e.category === c.value && e.status !== 'VOID').reduce((sum, e) => sum + e.amountPaise, 0) })).filter(c => c.total);
  const set = key => value => setForm(f => ({ ...f, [key]: value }));
  function edit(e) { setError(''); setForm({ original: e, clientId: e._id, category: e.category, amount: rupeeInput(e.amountPaise), date: e.date, status: e.status, paidDate: todayIST(), method: e.method || 'CASH', note: e.note || '', reason: '' }); }
  async function save() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (!form.original) {
        const body = { clientId: form.clientId, category: form.category, amountPaise: paise(form.amount), date: form.date, status: form.status, note: form.note.trim() };
        if (form.status === 'PAID') Object.assign(body, { paidDate: paymentDate(form.paidDate), method: form.method });
        await api.post('/finance/expenses', body, { params });
      } else {
        const e = form.original;
        const body = { revision: e.revision, correctionReason: form.reason.trim() };
        if (form.void) body.status = 'VOID';
        else {
          Object.assign(body, { category: form.category, note: form.note.trim() });
          if (e.status === 'UNPAID') {
            body.amountPaise = paise(form.amount);
            if (form.status === 'PAID') Object.assign(body, { status: 'PAID', paidDate: paymentDate(form.paidDate), method: form.method });
          }
        }
        await api.patch(`/finance/expenses/${e._id}`, body, { params: { propertyId, month: e.month } });
      }
      setForm(null); await Promise.all([cache.invalidateQueries({ queryKey: ['financeExpenses', propertyId] }), cache.invalidateQueries({ queryKey: ['financeReport', propertyId] })]);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Could not save expense.'); }
    finally { setBusy(false); }
  }
  return <Screen scroll edges={['left', 'right']} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}>
    <PageHeader title="Expenses" right={<Button size="sm" onPress={() => { setError(''); setForm({ clientId: submissionId(), category: 'FOOD', amount: '', date: month === currentFinanceMonth() ? todayIST() : `${month}-01`, status: 'PAID', paidDate: todayIST(), method: 'CASH', note: '' }); }}>Add expense</Button>} />
    <MonthPicker month={month} onChange={setMonth} disabled={busy} />
    <ChoiceField label="Status" options={[{ label: 'All', value: 'ALL' }, { label: 'Paid', value: 'PAID' }, { label: 'Unpaid', value: 'UNPAID' }, { label: 'Voided', value: 'VOID' }]} value={status} onChange={setStatus} />
    <ChoiceField label="Category" options={[{ label: 'All', value: 'ALL' }, ...EXPENSE_CATEGORIES]} value={category} onChange={setCategory} />
    <QueryState query={query}>
      {totals.length > 0 && <Card>{totals.map(c => <FinanceLine key={c.value} label={c.label} value={moneyPaise(c.total)} />)}</Card>}
      {!shown.length ? <StateView title="No expenses found" message="Record daily purchases or unpaid bills for this property." icon="receipt-outline" /> : shown.map(e => <Row key={e._id} icon="receipt-outline" title={labelOf(EXPENSE_CATEGORIES, e.category)} right={moneyPaise(e.amountPaise)} badge={e.status}
        subtitle={`${e.date}${e.status === 'PAID' ? ` · Paid ${new Date(e.paidDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}` : ''}${e.note ? ` · ${e.note}` : ''}`}
        onPress={e.status === 'VOID' ? undefined : () => edit(e)} />)}
    </QueryState>
    <Sheet visible={!!form} onClose={() => !busy && setForm(null)} title={form?.void ? 'Void expense' : form?.original ? 'Expense details' : 'Add expense'}>
      {form && <>
        <Notice message={error} />
        {form.void ? <FinanceLine label="Expense to void" value={moneyPaise(form.original.amountPaise)} /> : <>
          <ChoiceField label="Category" options={EXPENSE_CATEGORIES} value={form.category} onChange={set('category')} />
          <Field label="Amount (₹)" value={form.amount} onChangeText={set('amount')} editable={form.original?.status !== 'PAID'} keyboardType="decimal-pad" />
          <Field label="Expense date" value={form.date} onChangeText={set('date')} editable={!form.original} placeholder="YYYY-MM-DD" />
          {form.original?.status !== 'PAID' && <ChoiceField label="Status" options={[{ label: 'Paid', value: 'PAID' }, { label: 'Unpaid', value: 'UNPAID' }]} value={form.status} onChange={set('status')} />}
          {form.status === 'PAID' && form.original?.status !== 'PAID' && <>
            <Field label="Actual payment date" value={form.paidDate} onChangeText={set('paidDate')} placeholder="YYYY-MM-DD" />
            <ChoiceField label="Payment method" options={PAYMENT_METHODS} value={form.method} onChange={set('method')} />
          </>}
          {form.original?.status === 'PAID' && <Text style={{ ...typography.small, color: theme.textMuted }}>Paid {new Date(form.original.paidDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · {labelOf(PAYMENT_METHODS, form.original.method)}. Void and replace to correct payment details.</Text>}
          <Field label="Note (optional)" value={form.note} onChangeText={set('note')} />
        </>}
        {form.original && <Field label={form.void ? 'Reason for voiding' : 'Correction reason'} value={form.reason} onChangeText={set('reason')} />}
        <Button loading={busy} onPress={save}>{form.void ? 'Confirm void' : 'Save expense'}</Button>
        {form.original && !form.void && <Button variant="tertiary" disabled={busy} onPress={() => setForm(f => ({ ...f, void: true, reason: '' }))}>Void expense</Button>}
      </>}
    </Sheet>
  </Screen>;
}
