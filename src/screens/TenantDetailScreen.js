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
      await api.patch(`/tenants/${tenantId}`, {
        name: String(data.name).trim(),
        phone: String(data.phone).trim(),
        rentAmount: Number(data.rentAmount),
      });
      setEdits({});
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      await api.post(`/tenants/${tenantId}/checkout`, { vacatedDate: new Date().toISOString() });
      queryClient.invalidateQueries();
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
        <Field label="Monthly rent" value={String(data.rentAmount ?? '')} onChangeText={set('rentAmount')} keyboardType="numeric" error={errors.rentAmount} />

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
