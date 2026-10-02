import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, FormSection, QueryState, Row, Screen, SectionTitle, Stat, styles, typography, theme } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

export default function DashboardScreen({ navigation }) {
  const toast = useToast();
  const { api, user, activePropertyId, setActivePropertyId } = useAuth();
  const queryClient = useQueryClient();
  const propertyId = activePropertyId;
  const setPropertyId = setActivePropertyId;
  const [newProperty, setNewProperty] = useState('');
  const [creating, setCreating] = useState(false);

  const properties = useQuery({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/properties')).data.data,
  });

  useEffect(() => {
    if (!propertyId && properties.data?.[0]?._id) setPropertyId(properties.data[0]._id);
  }, [properties.data, propertyId]);

  const dashboard = useQuery({
    queryKey: ['dashboard', propertyId],
    enabled: !!propertyId,
    queryFn: async () => (await api.get(`/properties/${propertyId}/dashboard`)).data.data,
  });

  async function addProperty() {
    const name = newProperty.trim();
    if (!name || creating) return;
    try {
      setCreating(true);
      const { data } = await api.post('/properties', { name });
      setNewProperty('');
      setPropertyId(data.data._id);
      await properties.refetch();
      toast.success('Property created.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  const occupancy = dashboard.data?.occupancy || {};
  const pending = dashboard.data?.rentPending || [];
  const pendingAmount = pending.reduce((sum, cycle) => sum + (cycle.amountDue - cycle.amountPaid), 0);
  const refreshing = properties.isRefetching || dashboard.isRefetching;

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => queryClient.invalidateQueries()}
          tintColor={theme.brand}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.caption, color: theme.muted }}>YOUR PG TODAY</Text>
          <Text style={{ ...typography.h1, color: theme.text }} numberOfLines={1}>{dashboard.data?.property?.name || 'Your PG'}</Text>
          <Text style={{ ...typography.small, color: theme.muted }}>{user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'PG Manager'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open account" onPress={() => navigation.navigate('Account')} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <QueryState query={properties}>
        {!propertyId ? (
          <FormSection title="Set up your PG">
            <Text style={{ color: theme.muted }}>Create a property to start tracking occupancy and rent.</Text>
            <Field label="Property name" value={newProperty} onChangeText={setNewProperty} placeholder="Sai Residency PG" autoCapitalize="words" />
            <Button onPress={addProperty} loading={creating}>Create property</Button>
          </FormSection>
        ) : (
          <QueryState query={dashboard}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Stat label="Occupied" value={`${occupancy.occupiedBeds || 0}/${occupancy.totalBeds || 0}`} hint={`${occupancy.occupancyRate || 0}% full`} />
              <Stat label="Vacant" value={occupancy.vacantBeds || 0} hint="Ready to fill" tone={occupancy.vacantBeds ? 'ok' : 'default'} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Stat label="Vacating" value={dashboard.data?.vacatingSoon?.length || 0} hint="Next 30 days" tone={dashboard.data?.vacatingSoon?.length ? 'warn' : 'default'} />
              <Stat label="Rent due" value={money(pendingAmount)} hint={`${pending.length} pending`} tone={pendingAmount ? 'danger' : 'ok'} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button style={{ flex: 1 }} onPress={() => navigation.navigate('AddTenant', { propertyId })}>Add tenant</Button>
              <Button style={{ flex: 1 }} variant="secondary" onPress={() => navigation.navigate('Rent', { propertyId })}>Rent</Button>
            </View>


            <SectionTitle action={<Button variant="tertiary" onPress={() => navigation.navigate('Rooms', { propertyId })}>View rooms</Button>}>Vacant beds</SectionTitle>
            {(dashboard.data?.vacantBeds || []).length === 0 ? (
              <Text style={styles.empty}>Every bed is occupied.</Text>
            ) : (
              (dashboard.data?.vacantBeds || []).slice(0, 5).map((bed) => (
                <Row
                  key={bed._id}
                  title={`Bed ${bed.bedLabel}`}
                  subtitle={`Room ${bed.roomId?.roomNumber || '-'}`}
                  right="Open"
                  onPress={() => navigation.navigate('Rooms', { propertyId })}
                />
              ))
            )}

            <SectionTitle action={<Button variant="tertiary" onPress={() => navigation.navigate('Rent', { propertyId })}>View rent</Button>}>Rent pending</SectionTitle>
            {pending.length === 0 ? (
              <Text style={styles.empty}>All rent collected.</Text>
            ) : (
              pending.slice(0, 5).map((cycle) => (
                <Row
                  key={cycle._id}
                  title={cycle.tenantId?.name || 'Tenant'}
                  subtitle={`${cycle.month} - ${money(cycle.amountDue - cycle.amountPaid)} pending`}
                  badge={cycle.status}
                  onPress={() => navigation.navigate('Rent', { propertyId })}
                />
              ))
            )}
          </QueryState>
        )}
      </QueryState>

      
    </Screen>
  );
}
