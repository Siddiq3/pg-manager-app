import React, { useState } from 'react';
import { Alert, Linking, RefreshControl, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, PageHeader, QueryState, Stat, Row, Screen, Segmented, typography, theme } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

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
  async function recordPayment(){const amount=Number(paymentForm.amount);if(!payment||!(amount>0))return;try{setPayingId(payment._id);await api.post(`/rent-cycles/${payment._id}/payments`,{amount,method:paymentForm.method,date:new Date().toISOString(),note:paymentForm.note.trim()||undefined});queryClient.invalidateQueries({queryKey:['rentCycles',propertyId]});queryClient.invalidateQueries({queryKey:['dashboard']});setPayment(null);toast.success('Payment recorded.')}catch(error){toast.error(errorMessage(error))}finally{setPayingId('')}}

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

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={cycles.isRefetching} onRefresh={cycles.refetch} tintColor={theme.brand} />}>
      <PageHeader title="Rent" subtitle="Track dues and record collected payments." />
      {!cycles.isLoading && !cycles.isError && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat label="Pending rent" value={money((cycles.data || []).reduce((sum, cycle) => sum + Math.max(0, cycle.amountDue - cycle.amountPaid), 0))} />
        <Stat label="Collected" value={money((cycles.data || []).reduce((sum, cycle) => sum + cycle.amountPaid, 0))} />
      </View>}
      <QueryState query={cycles} empty="No rent cycles yet. They start when you add a tenant.">
        {(cycles.data || []).map((cycle) => {
          const phone = phoneOf(cycle);
          return (
            <Card key={cycle._id} style={{ gap: 10 }}>
              <Row flat
                title={cycle.tenantId?.name || 'Tenant'}
                subtitle={`${cycle.month} - ${money(cycle.amountPaid)} of ${money(cycle.amountDue)}`}
                badge={cycle.status}
                onPress={() => cycle.tenantId?._id && navigation.navigate('TenantDetail', { tenantId: cycle.tenantId._id })}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Button style={{ flex: 1, minWidth: 86 }} variant="ghost" onPress={() => open(phone && `tel:${phone}`, 'This tenant has no mobile number saved.')}>
                  Call
                </Button>
                <Button
                  style={{ flex: 1, minWidth: 86 }}
                  variant="ghost"
                  onPress={() => open(phone && `https://wa.me/${phone.replace(/^\+/, '')}`, 'This tenant has no mobile number saved.')}
                >
                  WhatsApp
                </Button>
                {cycle.status !== 'PAID' && (
                  <Button style={{ flex: 1, minWidth: 86 }} loading={payingId === cycle._id} onPress={() => openPayment(cycle)}>
                    Record payment
                  </Button>
                )}
              </View>
            </Card>
          );
        })}
      </QueryState>
      <Sheet visible={!!payment} onClose={()=>setPayment(null)} title="Record payment">
        <Text style={{ ...typography.small, color: theme.muted }}>{payment?.tenantId?.name || 'Tenant'} · {payment?.month} · {money((payment?.amountDue || 0) - (payment?.amountPaid || 0))} pending</Text>
        <Field label="Amount" value={paymentForm.amount} onChangeText={v=>setPaymentForm(p=>({...p,amount:v}))} keyboardType="numeric"/>
        <Segmented label="Payment method" value={paymentForm.method} onChange={v=>setPaymentForm(p=>({...p,method:v}))} options={[{label:'UPI',value:'UPI'},{label:'Cash',value:'CASH'},{label:'Bank',value:'BANK_TRANSFER'}]}/>
        <Field label="Note (optional)" value={paymentForm.note} onChangeText={v=>setPaymentForm(p=>({...p,note:v}))} autoCapitalize="sentences"/>
        <Button onPress={recordPayment} loading={!!payingId}>Record payment</Button>
      </Sheet>
    </Screen>
  );
}
