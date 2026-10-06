import React, { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Field, PageHeader, QueryState, Row, Screen, Segmented, StateView, Stat, theme } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';
import { isDaily } from '../lib/stay';

/** Everyone who has stayed at the property: current tenants, and those who moved out. */
export default function TenantsScreen({ navigation, route }) {
  const { api } = useAuth();
  const { propertyId } = route.params;
  const [status, setStatus] = useState('ACTIVE');
  const [search, setSearch] = useState('');

  const tenants = useQuery({
    queryKey: ['tenants', propertyId],
    queryFn: async () => (await api.get('/tenants', { params: { propertyId } })).data.data,
  });

  const all = tenants.data || [];
  const term = search.trim().toLowerCase();
  const shown = all.filter((t) => t.status === status && (!term || `${t.name} ${t.phone}`.toLowerCase().includes(term)));
  const current = all.filter((t) => t.status === 'ACTIVE').length;

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={tenants.isRefetching} onRefresh={tenants.refetch} tintColor={theme.brand} colors={[theme.brand]} />}>
      <PageHeader
        eyebrow="People"
        title="Tenants"
        subtitle={tenants.data ? `${current} staying now · ${all.length - current} moved out` : undefined}
        right={<Button size="sm" variant="ghost" icon={<Ionicons name="add" size={18} color={theme.primaryText} />} onPress={() => navigation.navigate('AddTenant', { propertyId })}>Add</Button>}
      />
      {tenants.isSuccess && <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat icon="people-outline" label="Staying now" value={current} hint="Current tenants" tone="info" />
        <Stat icon="exit-outline" label="Moved out" value={all.length - current} hint="Past tenants" />
      </View>}
      <Segmented label="Tenant status" value={status} onChange={setStatus} options={[{ label: 'Staying now', value: 'ACTIVE' }, { label: 'Moved out', value: 'VACATED' }]} />
      {all.length > 0 && <Field label="Search" placeholder="Search by name or mobile number" value={search} onChangeText={setSearch} />}
      <QueryState query={tenants}>
        {shown.length === 0 ? (
          <StateView
            icon="people-outline"
            title={term ? 'No matches' : status === 'ACTIVE' ? 'No tenants staying yet' : 'Nobody has moved out yet'}
            message={term ? 'Try a different name or number.' : status === 'ACTIVE' ? 'Add a tenant to a vacant bed to start tracking their rent.' : 'Tenants you check out appear here with their history.'}
          />
        ) : shown.map((t) => (
          <Row
            key={t._id}
            icon="person-outline"
            title={t.name}
            subtitle={[t.roomId?.roomNumber && `Room ${t.roomId.roomNumber}`, t.bedId?.bedLabel && `Bed ${t.bedId.bedLabel}`, isDaily(t) ? `${money(t.dailyRate)}/day` : money(t.rentAmount)].filter(Boolean).join(' · ')}
            badge={isDaily(t) ? 'Daily' : t.status === 'ACTIVE' && t.expectedVacateDate ? 'ON_NOTICE' : undefined}
            onPress={() => navigation.navigate('TenantDetail', { tenantId: t._id })}
          />
        ))}
      </QueryState>
    </Screen>
  );
}
