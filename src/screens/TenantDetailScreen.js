import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, QueryState, Screen, SectionTitle, theme } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

export default function TenantDetailScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { tenantId } = route.params;
  const [edits, setEdits] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');

  const tenant = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}`)).data.data,
  });

  const data = { ...(tenant.data || {}), ...edits };
  const set = (field) => (value) => {
    setEdits((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function save() {
    const found = {};
    if (String(data.name || '').trim().length < 2) found.name = 'Enter the tenant name.';
    if (String(data.phone || '').replace(/\D/g, '').length < 10) found.phone = 'Enter a valid mobile number.';
    if (!(Number(data.rentAmount) > 0)) found.rentAmount = 'Rent must be greater than zero.';
    setErrors(found);
    if (Object.keys(found).length || busy) return;

    try {
      setBusy('save');
      const { data: response } = await api.patch(`/tenants/${tenantId}`, {
        name: String(data.name).trim(),
        phone: String(data.phone).trim(),
        rentAmount: Number(data.rentAmount),
        depositAmount: Number(data.depositAmount || 0),
        depositPaid: !!data.depositPaid,
        depositRefunded: !!data.depositRefunded,
        idProofUrl: String(data.idProofUrl || '').trim(),
        noticeGivenDate: data.noticeGivenDate || undefined,
        expectedVacateDate: data.expectedVacateDate || undefined,
      });
      const propertyId = tenant.data?.propertyId?._id || tenant.data?.propertyId;
      queryClient.setQueryData(['tenant', tenantId], (current) => ({
        ...current,
        ...response.data,
        roomId: current?.roomId ?? response.data.roomId,
        bedId: current?.bedId ?? response.data.bedId,
      }));
      setEdits({});
      if (propertyId) queryClient.invalidateQueries({ queryKey: ['dashboard', propertyId] });
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
      const propertyId = tenant.data?.propertyId?._id || tenant.data?.propertyId;
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
        <SectionTitle action={data.status ? <Badge>{data.status}</Badge> : null}>
          {data.name || 'Tenant'}
        </SectionTitle>
        <Text style={{ color: theme.muted }}>
          {[data.roomId?.roomNumber && `Room ${data.roomId.roomNumber}`, data.bedId?.bedLabel && `Bed ${data.bedId.bedLabel}`]
            .filter(Boolean)
            .join(' - ')}
          {data.rentAmount ? ` - ${money(data.rentAmount)}/month` : ''}
        </Text>

        <Field label="Name" value={String(data.name || '')} onChangeText={set('name')} error={errors.name} autoCapitalize="words" />
        <Field label="Mobile number" value={String(data.phone || '')} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <SectionTitle>Rent & deposit</SectionTitle>
        <Field label="Monthly rent" value={String(data.rentAmount ?? '')} onChangeText={set('rentAmount')} keyboardType="numeric" error={errors.rentAmount} />
        <Field label="Deposit amount" value={String(data.depositAmount ?? '')} onChangeText={set('depositAmount')} keyboardType="numeric" />
        <Field label="ID proof URL" value={String(data.idProofUrl || '')} onChangeText={set('idProofUrl')} keyboardType="url" />
        <SectionTitle>Notice details</SectionTitle>
        <Field label="Notice given date" value={String(data.noticeGivenDate || '').slice(0,10)} onChangeText={set('noticeGivenDate')} placeholder="YYYY-MM-DD" />
        <Field label="Expected vacate date" value={String(data.expectedVacateDate || '').slice(0,10)} onChangeText={set('expectedVacateDate')} placeholder="YYYY-MM-DD" />
        <Button variant={data.depositPaid ? "secondary" : "tertiary"} onPress={()=>set("depositPaid")(!data.depositPaid)}>{data.depositPaid ? "Deposit paid" : "Mark deposit paid"}</Button>
        <Button variant={data.depositRefunded ? "secondary" : "tertiary"} onPress={()=>set("depositRefunded")(!data.depositRefunded)}>{data.depositRefunded ? "Deposit refunded" : "Mark deposit refunded"}</Button>

        <Button onPress={save} loading={busy === 'save'}>Save changes</Button>
        {data.status !== 'VACATED' && (
          <Button variant="danger" onPress={confirmCheckout} loading={busy === 'checkout'}>
            Check out tenant
          </Button>
        )}
      </QueryState>
    </Screen>
  );
}
