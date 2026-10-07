import React, { useState } from 'react';
import { Alert, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, PageHeader, Press, QueryState, Row, Screen, Segmented, StateView, Stat, fonts, radius, shadow, typography, theme } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { billLabel, errorMessage, money, monthLabel } from '../lib/format';
import { dayKey, history, monthSummary, overdue, upcoming } from '../lib/reports';

const VIEWS = [{ label: 'This month', value: 'month' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Overdue', value: 'overdue' }, { label: 'Reports', value: 'reports' }];
const PERIODS = [{ label: '3 months', value: 3 }, { label: '6 months', value: 6 }, { label: '12 months', value: 12 }];
const shortDate = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function RentScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId } = route.params;
  const [payingId, setPayingId] = useState('');
  const [payment, setPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({amount:'',method:'UPI',note:''});
  const [view, setView] = useState('month');
  const [period, setPeriod] = useState(3);

  const cycles = useQuery({
    queryKey: ['rentCycles', propertyId],
    queryFn: async () => (await api.get('/rent-cycles', { params: { propertyId } })).data.data,
  });

  function openPayment(cycle){const outstanding=cycle.amountDue-cycle.amountPaid;setPayment(cycle);setPaymentForm({amount:String(outstanding),method:'UPI',note:''})}
  async function recordPayment(){const amount=Number(paymentForm.amount);if(!payment||!(amount>0))return;try{setPayingId(payment._id);const {data}=await api.post(`/rent-cycles/${payment._id}/payments`,{amount,method:paymentForm.method,date:new Date().toISOString(),note:paymentForm.note.trim()||undefined});queryClient.setQueryData(['rentCycles',propertyId],(current=[])=>current.map(cycle=>cycle._id===data.data._id?{...data.data,tenantId:cycle.tenantId,propertyId:cycle.propertyId}:cycle));queryClient.invalidateQueries({queryKey:['dashboard',propertyId]});queryClient.invalidateQueries({queryKey:['tenantCycles']});setPayment(null);toast.success('Payment recorded.')}catch(error){toast.error(errorMessage(error))}finally{setPayingId('')}}

  async function open(url, missingMessage) {
    if (!url) {
      Alert.alert('No mobile number', missingMessage);
      return;
    }
    // openURL rejects when no app can handle the link; without this it becomes
    // an unhandled rejection and a red screen in development.
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'No app on this device can handle that link.');
    }
  }

  const phoneOf = (cycle) => String(cycle.tenantId?.phone || '').replace(/[^\d+]/g, '');
  const bills = cycles.data || [];
  const today = dayKey(Date.now());
  const thisMonth = today.slice(0, 7);
  const month = monthSummary(bills, thisMonth);
  const late = overdue(bills, today);
  const lateTotal = late.reduce((sum, c) => sum + c.amountDue - c.amountPaid, 0);
  const soon = upcoming(bills, today, 30);
  const report = history(bills, thisMonth, period);
  const openTenant = (tenant) => tenant?._id && navigation.navigate('TenantDetail', { tenantId: tenant._id });

  const card = (cycle) => {
    const phone = phoneOf(cycle);
    const progress = cycle.amountDue ? Math.min(1, cycle.amountPaid / cycle.amountDue) : 0;
    return (
      <View key={cycle._id} style={rs.card}>
        <Press scaleTo={0.99} accessibilityRole="button" onPress={() => openTenant(cycle.tenantId)} style={rs.head}>
          <View style={rs.avatar}><Text style={rs.avatarText}>{(cycle.tenantId?.name || 'T').slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={rs.name} numberOfLines={1}>{cycle.tenantId?.name || 'Tenant'}</Text>
            <Text style={rs.meta}>{billLabel(cycle)} · due {shortDate(dayKey(cycle.dueDate))}</Text>
          </View>
          <Badge>{cycle.status}</Badge>
        </Press>
        <View style={rs.amounts}>
          <Text style={rs.paid}>{money(cycle.amountPaid)}</Text>
          <Text style={rs.due}> of {money(cycle.amountDue)}</Text>
        </View>
        {cycle.amountPaid > cycle.amountDue && <Text style={rs.refund}>{money(cycle.amountPaid - cycle.amountDue)} to refund: they left before the paid-up date.</Text>}
        <View style={rs.bar}><View style={[rs.barFill, { width: `${progress * 100}%` }, cycle.status === 'PAID' && { backgroundColor: theme.success }]} /></View>
        <View style={rs.actions}>
          <IconAction icon="call-outline" label="Call" onPress={() => open(phone && `tel:${phone}`, 'This tenant has no mobile number saved.')} />
          <IconAction icon="logo-whatsapp" label="WhatsApp" onPress={() => open(phone && `https://wa.me/${phone.replace(/^\+/, '')}`, 'This tenant has no mobile number saved.')} />
          {cycle.status !== 'PAID' && (
            <Button size="sm" style={{ flex: 1 }} loading={payingId === cycle._id} onPress={() => openPayment(cycle)}>
              Mark paid
            </Button>
          )}
        </View>
      </View>
    );
  };
  const empty = (title, message) => <StateView icon="checkmark-done-outline" title={title} message={message} />;

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={cycles.isRefetching} onRefresh={cycles.refetch} tintColor={theme.brand} colors={[theme.brand]} />}>
      <PageHeader
        eyebrow="Collections"
        title="Rent"
        subtitle={cycles.data ? `${money(month.collected)} collected in ${monthLabel(thisMonth)} · ${money(month.pending)} still due` : undefined}
      />
      {cycles.isSuccess && <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat icon="wallet-outline" label={`Collected · ${monthLabel(thisMonth).split(' ')[0]}`} value={money(month.collected)} hint={`Of ${money(month.billed)} billed this month`} tone="ok" />
        <Stat icon="alert-circle-outline" label="Overdue" value={money(lateTotal)} hint={`${late.length} ${late.length === 1 ? 'bill' : 'bills'} past due`} tone={lateTotal ? 'danger' : 'ok'} />
      </View>}
      <Segmented label="Rent view" value={view} onChange={setView} options={VIEWS} />
      <QueryState query={cycles} empty="No rent cycles yet. They start when you add a tenant.">
        {view === 'month' && (month.bills.length ? month.bills.map(card) : empty('No bills this month', 'Bills appear here as tenants\' due dates come round.'))}
        {view === 'overdue' && (late.length ? late.map(card) : empty('Nothing overdue', 'Every bill that has fallen due is paid.'))}
        {view === 'upcoming' && (soon.length ? soon.map((item) => (
          <Row key={item.key} icon={item.projected ? 'calendar-outline' : 'time-outline'} title={item.tenant?.name || 'Tenant'}
            subtitle={`Due ${shortDate(item.date)} · ${item.projected ? `${monthLabel(item.date.slice(0, 7))} rent` : billLabel(item.bill)}`}
            right={money(item.amount)} onPress={() => openTenant(item.tenant)} />
        )) : empty('Nothing due in the next 30 days', 'Upcoming rent shows here before it falls due.'))}
        {view === 'reports' && <>
          <Segmented label="Report period" value={period} onChange={setPeriod} options={PERIODS} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat icon="cash-outline" label="Collected" value={money(report.collected)} hint={`Last ${period} months`} tone="ok" />
            <Stat icon="receipt-outline" label="Billed" value={money(report.billed)} hint={report.billed ? `${Math.round((report.collected / report.billed) * 100)}% collected` : 'No bills yet'} />
          </View>
          {[...report.rows].reverse().map((row) => (
            <View key={row.month} style={rs.reportRow}>
              <View style={rs.reportHead}>
                <Text style={rs.name}>{monthLabel(row.month)}</Text>
                <Text style={rs.meta}>{money(row.collected)} of {money(row.billed)}</Text>
              </View>
              <View style={rs.bar}><View style={[rs.barFill, { width: `${row.billed ? Math.min(1, row.collected / row.billed) * 100 : 0}%` }]} /></View>
            </View>
          ))}
          <Text style={rs.note}>Collected is money received in that month, including late payments for earlier bills.</Text>
        </>}
      </QueryState>
      <Sheet visible={!!payment} onClose={()=>setPayment(null)} title="Record payment">
        <Field label="Amount" placeholder="Enter amount received" value={paymentForm.amount} onChangeText={v=>setPaymentForm(p=>({...p,amount:v}))} keyboardType="numeric"/>
        <Segmented label="Payment method" value={paymentForm.method} onChange={v=>setPaymentForm(p=>({...p,method:v}))} options={[{label:'UPI',value:'UPI'},{label:'Cash',value:'CASH'},{label:'Bank',value:'BANK_TRANSFER'}]}/>
        <Field label="Note (optional)" placeholder="Add a note" value={paymentForm.note} onChangeText={v=>setPaymentForm(p=>({...p,note:v}))} autoCapitalize="sentences"/>
        <Button onPress={recordPayment} loading={!!payingId}>Record payment</Button>
      </Sheet>
    </Screen>
  );
}

function IconAction({ icon, label, onPress }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={rs.iconAction}>
      <Ionicons name={icon} size={19} color={theme.primaryText} />
    </Press>
  );
}

const rs = StyleSheet.create({
  card: { backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, padding: 16, gap: 12, ...shadow.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 17, color: theme.primaryText },
  name: { ...typography.bodyStrong, color: theme.text },
  meta: { ...typography.caption, color: theme.textMuted },
  amounts: { flexDirection: 'row', alignItems: 'baseline' },
  paid: { ...typography.h2, fontSize: 22, color: theme.text, fontVariant: ['tabular-nums'] },
  due: { ...typography.small, color: theme.textMuted },
  refund: { ...typography.small, color: theme.warning },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: theme.primary },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  reportRow: { backgroundColor: theme.surface, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, padding: 14, gap: 10 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  note: { ...typography.caption, color: theme.textMuted },
  iconAction: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
});
