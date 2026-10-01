import React, { useState } from 'react';
import { Alert, Linking, RefreshControl, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, QueryState, Row, Screen, typography, theme } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

export default function RentScreen({ navigation, route }) {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId } = route.params;
  const [payingId, setPayingId] = useState('');

  const cycles = useQuery({
    queryKey: ['rentCycles', propertyId],
    queryFn: async () => (await api.get('/rent-cycles', { params: { propertyId } })).data.data,
  });

  async function markPaid(cycle) {
    const outstanding = cycle.amountDue - cycle.amountPaid;
    // Guard against a double tap recording the payment twice.
    if (outstanding <= 0 || payingId) return;
    try {
      setPayingId(cycle._id);
      await api.post(`/rent-cycles/${cycle._id}/payments`, {
        amount: outstanding,
        method: 'UPI',
        date: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['rentCycles', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      Alert.alert('Payment not recorded', errorMessage(error));
    } finally {
      setPayingId('');
    }
  }

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
      <Text style={{ ...typography.h2, color: theme.text }}>Rent</Text>
      <QueryState query={cycles} empty="No rent cycles yet. They start when you add a tenant.">
        {(cycles.data || []).map((cycle) => {
          const phone = phoneOf(cycle);
          return (
            <View key={cycle._id} style={{ gap: 8 }}>
              <Row
                title={cycle.tenantId?.name || 'Tenant'}
                subtitle={`${cycle.month} - ${money(cycle.amountPaid)} of ${money(cycle.amountDue)}`}
                badge={cycle.status}
                onPress={() => cycle.tenantId?._id && navigation.navigate('TenantDetail', { tenantId: cycle.tenantId._id })}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button style={{ flex: 1 }} variant="ghost" onPress={() => open(phone && `tel:${phone}`, 'This tenant has no mobile number saved.')}>
                  Call
                </Button>
                <Button
                  style={{ flex: 1 }}
                  variant="ghost"
                  onPress={() => open(phone && `https://wa.me/${phone.replace(/^\+/, '')}`, 'This tenant has no mobile number saved.')}
                >
                  WhatsApp
                </Button>
                {cycle.status !== 'PAID' && (
                  <Button style={{ flex: 1 }} loading={payingId === cycle._id} onPress={() => markPaid(cycle)}>
                    Mark paid
                  </Button>
                )}
              </View>
            </View>
          );
        })}
      </QueryState>
    </Screen>
  );
}
