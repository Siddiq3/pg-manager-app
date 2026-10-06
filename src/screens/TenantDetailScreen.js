import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Divider, Field, Notice, PageHeader, QueryState, Row, Screen, SectionTitle, StateView, Toggle, fonts, theme, typography } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { billLabel, errorMessage, money } from '../lib/format';
import { isDaily, stayNights } from '../lib/stay';

const METHOD = { UPI: 'UPI', CASH: 'Cash', BANK_TRANSFER: 'Bank transfer' };
const idOf = (value) => value?._id || value;

export default function TenantDetailScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { tenantId } = route.params;
  const [edits, setEdits] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');

  const [moving, setMoving] = useState(false);

  const tenant = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}`)).data.data,
  });
  const propertyId = idOf(tenant.data?.propertyId);

  // Every month's rent for this tenant, newest first, with each payment's method and note.
  const history = useQuery({
    queryKey: ['tenantCycles', tenantId],
    queryFn: async () => (await api.get('/rent-cycles', { params: { tenantId } })).data.data,
  });

  const vacantBeds = useQuery({
    queryKey: ['vacantBeds', propertyId],
    enabled: moving && !!propertyId,
    queryFn: async () => (await api.get('/beds', { params: { propertyId, status: 'VACANT' } })).data.data,
  });

  /** After a move, checkout or delete, every list that shows beds or tenants is stale. */
  function refreshProperty() {
    for (const key of ['dashboard', 'beds', 'vacantBeds', 'rooms', 'tenants', 'rentCycles']) {
      queryClient.invalidateQueries({ queryKey: [key, propertyId] });
    }
    queryClient.invalidateQueries({ queryKey: ['room'] });
  }

  async function moveTo(bed) {
    try {
      setBusy('move');
      await api.patch(`/tenants/${tenantId}`, { roomId: idOf(bed.roomId), bedId: bed._id });
      setMoving(false);
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      refreshProperty();
      toast.success(`Moved to Room ${bed.roomId?.roomNumber || ''}, bed ${bed.bedLabel}.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete tenant record?',
      `${data.name || 'This tenant'} and all of their rent history will be deleted for good. To keep their history, check them out instead.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: remove },
      ],
    );
  }

  async function remove() {
    try {
      setBusy('delete');
      await api.delete(`/tenants/${tenantId}`);
      refreshProperty();
      queryClient.removeQueries({ queryKey: ['tenant', tenantId] });
      toast.success('Tenant record deleted.');
      navigation.goBack();
    } catch (error) {
      toast.error(errorMessage(error));
      setBusy('');
    }
  }

  const data = { ...(tenant.data || {}), ...edits };
  const daily = isDaily(data);
  const checkIn = String(data.joinedDate || '').slice(0, 10);
  const checkOut = String(data.expectedVacateDate || '').slice(0, 10);
  const overstayed = daily && data.status === 'ACTIVE' && checkOut && checkOut < new Date().toISOString().slice(0, 10);
  const set = (field) => (value) => {
    setEdits((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function save() {
    const found = {};
    if (String(data.name || '').trim().length < 2) found.name = 'Enter the tenant name.';
    if (String(data.phone || '').replace(/\D/g, '').length < 10) found.phone = 'Enter a valid mobile number.';
    if (!daily && !(Number(data.rentAmount) > 0)) found.rentAmount = 'Rent must be greater than zero.';
    if (daily && !(Number(data.dailyRate) > 0)) found.dailyRate = 'Per-day rate must be greater than zero.';
    if (daily && !(checkOut >= checkIn)) found.expectedVacateDate = 'Check-out cannot be before check-in.';
    setErrors(found);
    if (Object.keys(found).length || busy) return;

    try {
      setBusy('save');
      const { data: response } = await api.patch(`/tenants/${tenantId}`, {
        name: String(data.name).trim(),
        phone: String(data.phone).trim(),
        ...(daily ? { dailyRate: Number(data.dailyRate) } : { rentAmount: Number(data.rentAmount) }),
        depositAmount: Number(data.depositAmount || 0),
        depositPaid: !!data.depositPaid,
        depositRefunded: !!data.depositRefunded,
        idProofUrl: String(data.idProofUrl || '').trim(),
        noticeGivenDate: !daily && data.noticeGivenDate || undefined,
        expectedVacateDate: data.expectedVacateDate || undefined,
      });
      queryClient.setQueryData(['tenant', tenantId], (current) => ({
        ...current,
        ...response.data,
        roomId: current?.roomId ?? response.data.roomId,
        bedId: current?.bedId ?? response.data.bedId,
      }));
      setEdits({});
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['tenants', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['rentCycles', propertyId] });
      }
      // A daily guest's bill is re-priced when their dates or rate change.
      queryClient.invalidateQueries({ queryKey: ['tenantCycles', tenantId] });
      toast.success('Tenant details updated.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  function confirmCheckout() {
    Alert.alert('Check out tenant?', `${data.name || 'This tenant'} will be marked vacated and the bed freed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check out', style: 'destructive', onPress: checkout },
    ]);
  }

  async function checkout() {
    try {
      setBusy('checkout');
      const roomId = tenant.data?.roomId?._id || tenant.data?.roomId;
      const { data: response } = await api.post(`/tenants/${tenantId}/checkout`, { vacatedDate: new Date().toISOString() });
      queryClient.setQueryData(['tenant', tenantId], (current) => ({
        ...current,
        ...response.data,
        roomId: current?.roomId ?? response.data.roomId,
        bedId: current?.bedId ?? response.data.bedId,
      }));
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['beds', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['vacantBeds', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['tenants', propertyId] });
      }
      if (roomId) queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      toast.success('Tenant checked out. The bed is vacant now.');
      navigation.goBack();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  return (
    <Screen scroll>
      <QueryState query={tenant}>
        <PageHeader
          eyebrow={[data.roomId?.roomNumber && `Room ${data.roomId.roomNumber}`, data.bedId?.bedLabel && `Bed ${data.bedId.bedLabel}`].filter(Boolean).join(' · ') || 'Tenant'}
          title={data.name || 'Tenant'}
          subtitle={daily ? `${money(data.dailyRate)} / day · daily stay` : data.rentAmount ? `${money(data.rentAmount)} / month` : undefined}
          right={data.status ? <Badge>{data.status}</Badge> : null}
        />

        <SectionTitle>Details</SectionTitle>

        <Field label="Name" placeholder="Enter tenant's name" value={String(data.name || '')} onChangeText={set('name')} error={errors.name} autoCapitalize="words" />
        <Field label="Mobile number" placeholder="Enter tenant's mobile number" value={String(data.phone || '')} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        {daily ? <>
          <Field label="Per-day rate" placeholder="Enter per-day rate" value={String(data.dailyRate ?? '')} onChangeText={set('dailyRate')} keyboardType="numeric" error={errors.dailyRate} />
          <Field label="Planned check-out date" placeholder="Enter date (YYYY-MM-DD)" value={checkOut} onChangeText={set('expectedVacateDate')} error={errors.expectedVacateDate} />
          {overstayed && <Notice tone="warn" icon="time-outline" message={`Planned check-out was ${checkOut}. Extend the stay or check them out.`} />}
          {checkOut >= checkIn && Number(data.dailyRate) > 0 && <Notice tone="muted" icon="calculator-outline" message={`Checked in ${checkIn}: ${stayNights(checkIn, checkOut)} days × ${money(data.dailyRate)} = ${money(stayNights(checkIn, checkOut) * Number(data.dailyRate))}`} />}
        </> : (
          <Field label="Monthly rent" placeholder="Enter monthly rent" value={String(data.rentAmount ?? '')} onChangeText={set('rentAmount')} keyboardType="numeric" error={errors.rentAmount} />
        )}
        <Field label="Deposit amount" placeholder="Enter deposit amount" value={String(data.depositAmount ?? '')} onChangeText={set('depositAmount')} keyboardType="numeric" />
        <Field label="ID proof URL" placeholder="Enter ID proof link" value={String(data.idProofUrl || '')} onChangeText={set('idProofUrl')} keyboardType="url" />
        {!daily && <>
          <Field label="Notice given date" placeholder="Enter date (YYYY-MM-DD)" value={String(data.noticeGivenDate || '').slice(0,10)} onChangeText={set('noticeGivenDate')} />
          <Field label="Expected vacate date" placeholder="Enter date (YYYY-MM-DD)" value={String(data.expectedVacateDate || '').slice(0,10)} onChangeText={set('expectedVacateDate')} />
        </>}
        <SectionTitle>Deposit</SectionTitle>
        <Toggle label="Deposit paid" value={!!data.depositPaid} onChange={set('depositPaid')} />
        <Toggle label="Deposit refunded" value={!!data.depositRefunded} onChange={set('depositRefunded')} />

        <Button size="lg" onPress={save} loading={busy === 'save'}>Save changes</Button>
        {data.status !== 'VACATED' && (
          <Button variant="secondary" onPress={() => setMoving(true)}>Move to another bed</Button>
        )}

        <SectionTitle>Rent history</SectionTitle>
        <QueryState query={history} empty="No rent recorded yet.">
          {[...(history.data || [])].sort((a, b) => b.month.localeCompare(a.month)).map((cycle) => (
            <Card key={cycle._id} style={st.cycle}>
              <View style={st.cycleHead}>
                <Text style={st.cycleMonth}>{billLabel(cycle)}</Text>
                <Badge>{cycle.status}</Badge>
              </View>
              <Text style={st.cycleAmount}>{money(cycle.amountPaid)} <Text style={st.cycleOf}>of {money(cycle.amountDue)}</Text></Text>
              {cycle.amountPaid > cycle.amountDue && <Text style={st.refund}>{money(cycle.amountPaid - cycle.amountDue)} to refund: they left before the paid-up date.</Text>}
              {(cycle.payments || []).map((p) => (
                <View key={p._id}>
                  <Divider style={{ marginVertical: 8 }} />
                  <View style={st.payment}>
                    <Text style={st.paymentWhat}>{money(p.amount)} · {METHOD[p.method] || p.method}</Text>
                    <Text style={st.paymentDate}>{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                  {!!p.note && <Text style={st.paymentNote}>{p.note}</Text>}
                </View>
              ))}
            </Card>
          ))}
        </QueryState>

        <SectionTitle>Danger zone</SectionTitle>
        {data.status !== 'VACATED' && (
          <Button variant="danger" onPress={confirmCheckout} loading={busy === 'checkout'}>
            Check out tenant
          </Button>
        )}
        <Button variant="tertiary" onPress={confirmDelete} loading={busy === 'delete'}>Delete tenant record</Button>
      </QueryState>

      <Sheet visible={moving} onClose={() => setMoving(false)} title="Move to another bed">
        <QueryState query={vacantBeds}>
          {(vacantBeds.data || []).length === 0 ? (
            <StateView icon="bed-outline" title="No vacant beds" message="Add a bed to a room, or check someone out first." />
          ) : (vacantBeds.data || []).map((bed) => (
            <Row key={bed._id} icon="bed-outline" title={`Room ${bed.roomId?.roomNumber || '-'}, bed ${bed.bedLabel}`} right="Move here" chevron={false}
              onPress={() => busy !== 'move' && moveTo(bed)} />
          ))}
        </QueryState>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  cycle: { gap: 4 },
  cycleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleMonth: { ...typography.bodyStrong, color: theme.text },
  cycleAmount: { fontFamily: fonts.display, fontSize: 20, color: theme.text, fontVariant: ['tabular-nums'] },
  cycleOf: { ...typography.small, color: theme.textMuted },
  refund: { ...typography.small, color: theme.warning, marginTop: 4 },
  payment: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentWhat: { ...typography.small, fontFamily: fonts.semibold, color: theme.text },
  paymentDate: { ...typography.small, color: theme.textMuted },
  paymentNote: { ...typography.caption, color: theme.textMuted, marginTop: 2 },
});
