import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, PageHeader, Press, QueryState, Row, Screen, SectionTitle, Stat, fonts, radius, shadow, styles, typography, theme } from '../components/ui';
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
          colors={[theme.brand]}
        />
      }
    >
      <PageHeader
        eyebrow={user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome back'}
        title={dashboard.data?.property?.name || 'Your PG'}
        right={(
          <Press onPress={() => navigation.navigate('Account')} accessibilityLabel="Account" style={ds.avatar}>
            <Text style={ds.avatarText}>{(user?.name || 'P').slice(0, 1).toUpperCase()}</Text>
          </Press>
        )}
      />

      <QueryState query={properties}>
        {!propertyId ? (
          <Card style={{ gap: 16 }}>
            <View style={ds.setupIcon}><Ionicons name="business-outline" size={26} color={theme.primary} /></View>
            <View style={{ gap: 4 }}>
              <Text style={{ ...typography.h3, color: theme.text }}>Add your first property</Text>
              <Text style={{ ...typography.body, color: theme.textMuted }}>Create a property to start tracking occupancy and rent.</Text>
            </View>
            <Field label="Property name" value={newProperty} onChangeText={setNewProperty} placeholder="Sai Residency PG" autoCapitalize="words" />
            <Button onPress={addProperty} loading={creating}>Create property</Button>
          </Card>
        ) : (
          <>
            <View style={ds.grid}>
              <Stat icon="bed-outline" label="Occupied" value={`${occupancy.occupiedBeds || 0}/${occupancy.totalBeds || 0}`} hint={`${occupancy.occupancyRate || 0}% full`} tone="info" />
              <Stat icon="sparkles-outline" label="Vacant" value={occupancy.vacantBeds || 0} hint="Ready to fill" tone={occupancy.vacantBeds ? 'ok' : 'default'} />
            </View>
            <View style={ds.grid}>
              <Stat icon="exit-outline" label="Vacating" value={dashboard.data?.vacatingSoon?.length || 0} hint="Next 30 days" tone={dashboard.data?.vacatingSoon?.length ? 'warn' : 'default'} />
              <Stat icon="wallet-outline" label="Rent due" value={money(pendingAmount)} hint={`${pending.length} pending`} tone={pendingAmount ? 'danger' : 'ok'} />
            </View>

            <View style={ds.grid}>
              <QuickAction icon="person-add-outline" label="Add tenant" primary onPress={() => navigation.navigate('AddTenant', { propertyId })} />
              <QuickAction icon="wallet-outline" label="Rent" onPress={() => navigation.navigate('Rent', { propertyId })} />
              <QuickAction icon="bed-outline" label="Rooms" onPress={() => navigation.navigate('Rooms', { propertyId })} />
            </View>

            <SectionTitle>Vacant beds</SectionTitle>
            {(dashboard.data?.vacantBeds || []).length === 0 ? (
              <Text style={styles.empty}>Every bed is occupied.</Text>
            ) : (
              (dashboard.data?.vacantBeds || []).slice(0, 5).map((bed) => (
                <Row
                  key={bed._id}
                  icon="bed-outline"
                  title={`Bed ${bed.bedLabel}`}
                  subtitle={`Room ${bed.roomId?.roomNumber || '-'}`}
                  badge="VACANT"
                  onPress={() => navigation.navigate('Rooms', { propertyId })}
                />
              ))
            )}

            <SectionTitle>Rent pending</SectionTitle>
            {pending.length === 0 ? (
              <Text style={styles.empty}>All rent collected.</Text>
            ) : (
              pending.slice(0, 5).map((cycle) => (
                <Row
                  key={cycle._id}
                  icon="person-outline"
                  title={cycle.tenantId?.name || 'Tenant'}
                  subtitle={`${cycle.month} · ${money(cycle.amountDue - cycle.amountPaid)} pending`}
                  badge={cycle.status}
                  onPress={() => navigation.navigate('Rent', { propertyId })}
                />
              ))
            )}
          </>
        )}
      </QueryState>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress, primary }) {
  return (
    <Press onPress={onPress} haptics={primary ? 'press' : 'tap'} accessibilityRole="button" accessibilityLabel={label} style={[ds.action, primary && ds.actionPrimary]}>
      <View style={[ds.actionIcon, primary && ds.actionIconPrimary]}>
        <Ionicons name={icon} size={20} color={primary ? '#fff' : theme.primary} />
      </View>
      <Text style={[ds.actionLabel, primary && { color: '#fff' }]} numberOfLines={1}>{label}</Text>
    </Press>
  );
}

const ds = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 19, color: theme.primaryText },
  setupIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  action: { flex: 1, minHeight: 92, borderRadius: radius.lg, backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, padding: 14, justifyContent: 'space-between', ...shadow.subtle },
  actionPrimary: { backgroundColor: theme.primary, borderColor: theme.primary },
  actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  actionIconPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  actionLabel: { ...typography.label, color: theme.text, marginTop: 10 },
});
