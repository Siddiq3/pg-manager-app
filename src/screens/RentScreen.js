import React, { useState } from 'react';
import { Alert, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, PageHeader, Press, QueryState, Screen, Segmented, fonts, radius, shadow, typography, theme } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money, monthLabel } from '../lib/format';

export default function RentScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId } = route.params;
  const [payingId, setPayingId] = useState('');
  const [payment, setPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({amount:'',method:'UPI',note:''});

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

  const outstanding = (cycles.data || []).reduce((sum, c) => sum + Math.max(0, c.amountDue - c.amountPaid), 0);
  const phoneOf = (cycle) => String(cycle.tenantId?.phone || '').replace(/[^\d+]/g, '');

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={cycles.isRefetching} onRefresh={cycles.refetch} tintColor={theme.brand} colors={[theme.brand]} />}>
      <PageHeader
        eyebrow="Collections"
        title="Rent"
        subtitle={cycles.data ? `${money(outstanding)} outstanding · ${cycles.data.filter((c) => c.status !== 'PAID').length} open` : undefined}
      />
      <QueryState query={cycles} empty="No rent cycles yet. They start when you add a tenant.">
        {(cycles.data || []).map((cycle) => {
          const phone = phoneOf(cycle);
          const progress = cycle.amountDue ? Math.min(1, cycle.amountPaid / cycle.amountDue) : 0;
          return (
            <View key={cycle._id} style={rs.card}>
              <Press
                scaleTo={0.99}
                accessibilityRole="button"
                onPress={() => cycle.tenantId?._id && navigation.navigate('TenantDetail', { tenantId: cycle.tenantId._id })}
                style={rs.head}
              >
                <View style={rs.avatar}><Text style={rs.avatarText}>{(cycle.tenantId?.name || 'T').slice(0, 1).toUpperCase()}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={rs.name} numberOfLines={1}>{cycle.tenantId?.name || 'Tenant'}</Text>
                  <Text style={rs.meta}>{monthLabel(cycle.month)}</Text>
                </View>
                <Badge>{cycle.status}</Badge>
              </Press>
              <View style={rs.amounts}>
                <Text style={rs.paid}>{money(cycle.amountPaid)}</Text>
                <Text style={rs.due}> of {money(cycle.amountDue)}</Text>
              </View>
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
        })}
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
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: theme.primary },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconAction: { width: 44, height: 40, borderRadius: radius.sm, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
});
