import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, FadeIn, Field, PageHeader, Press, QueryState, Row, Screen, SectionTitle, Stat, fonts, radius, shadow, styles, typography, theme } from '../components/ui';
import { useToast } from '../components/Toast';
import { Sheet } from '../components/Sheet';
import { useAuth } from '../context/AuthContext';
import { billLabel, errorMessage, money } from '../lib/format';

export default function DashboardScreen({ navigation }) {
  const toast = useToast();
  const { api, user, activePropertyId, setActivePropertyId } = useAuth();
  const queryClient = useQueryClient();
  const propertyId = activePropertyId;
  const setPropertyId = setActivePropertyId;
  const [newProperty, setNewProperty] = useState('');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);

  const properties = useQuery({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/properties')).data.data,
  });

  // Keep the selection valid: a saved property can be deleted, or a co-owner can lose access.
  useEffect(() => {
    if (!properties.data) return;
    if (!properties.data.some((property) => property._id === propertyId)) setPropertyId(properties.data[0]?._id || '');
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
      setSwitching(false);
      setPropertyId(data.data._id);
      queryClient.setQueryData(['properties'], (current = []) => [
        data.data,
        ...current.filter((property) => property._id !== data.data._id),
      ]);
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
          onRefresh={() =>
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ['properties'] }),
              propertyId
                ? queryClient.invalidateQueries({ queryKey: ['dashboard', propertyId] })
                : Promise.resolve(),
            ])
          }
          tintColor={theme.brand}
          colors={[theme.brand]}
        />
      }
    >
      <PageHeader
        eyebrow={user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome back'}
        title={dashboard.data?.property?.name || 'Your PG'}
        onTitlePress={propertyId ? () => setSwitching(true) : undefined}
        titleHint="Switch property or add another"
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
            <Field label="Property name" placeholder="Enter property name" value={newProperty} onChangeText={setNewProperty} autoCapitalize="words" />
            <Button onPress={addProperty} loading={creating}>Create property</Button>
          </Card>
        ) : (
          <QueryState query={dashboard}>
            <FadeIn>
              <Press onPress={() => navigation.navigate('DashboardReport', { propertyId, report: 'occupied' })} scaleTo={0.99} accessibilityRole="button"
                accessibilityLabel={`Occupancy ${occupancy.occupancyRate || 0} percent, ${occupancy.occupiedBeds || 0} of ${occupancy.totalBeds || 0} beds occupied`} accessibilityHint="Open the occupied beds report" style={ds.overview}>
              <View style={ds.overviewFigures}><Text style={ds.overviewValue}>{occupancy.occupancyRate || 0}<Text style={ds.overviewPercent}>%</Text></Text><View style={{ flex: 1 }}><Text style={ds.overviewTitle}>Occupancy</Text><Text style={ds.overviewMeta}>{occupancy.occupiedBeds || 0} of {occupancy.totalBeds || 0} beds occupied</Text></View><Ionicons name="chevron-forward" size={18} color={theme.inkMuted} /></View>
              <View style={ds.overviewTrack}><View style={[ds.overviewFill, { width: `${Math.max(0, Math.min(100, Number(occupancy.occupancyRate) || 0))}%` }]} /></View>
              </Press>
            </FadeIn>
            <View style={ds.grid}>
              <Stat icon="exit-outline" label="Vacating" onPress={() => navigation.navigate('DashboardReport', { propertyId, report: 'vacating' })} value={dashboard.data?.vacatingSoon?.length || 0} hint="Next 30 days" tone={dashboard.data?.vacatingSoon?.length ? 'warn' : 'default'} />
              <Stat icon="wallet-outline" label="Rent due" onPress={() => navigation.navigate('DashboardReport', { propertyId, report: 'rent' })} value={money(pendingAmount)} hint={`${pending.length} pending`} tone={pendingAmount ? 'danger' : 'ok'} />
            </View>

            {!occupancy.totalBeds && (
              <Card style={{ gap: 12 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ ...typography.h3, color: theme.text }}>Add your rooms and beds</Text>
                  <Text style={{ ...typography.body, color: theme.textMuted }}>Tenants are added to a bed, so set up your rooms first.</Text>
                </View>
                <Button onPress={() => navigation.navigate('Rooms', { propertyId })}>Set up rooms</Button>
              </Card>
            )}

            <Row icon="receipt-outline" title="Staff & Expenses" subtitle="Salaries, daily wages and monthly spending" onPress={() => navigation.navigate('FinanceHub', { propertyId })} />

            <Button icon={<Ionicons name="person-add-outline" size={19} color="#fff" />} onPress={() => navigation.navigate('AddTenant', { propertyId })}>Add tenant</Button>

            <SectionTitle action={<Button size="sm" variant="tertiary" onPress={() => navigation.navigate('DashboardReport', { propertyId, report: 'vacant' })}>View all</Button>}>Vacant beds</SectionTitle>
            {(dashboard.data?.vacantBeds || []).length === 0 ? (
              <Text style={styles.empty}>{occupancy.totalBeds ? 'Every bed is occupied.' : 'No beds added yet.'}</Text>
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

            <SectionTitle action={<Button size="sm" variant="tertiary" onPress={() => navigation.navigate('DashboardReport', { propertyId, report: 'rent' })}>View all</Button>}>Rent pending</SectionTitle>
            {pending.length === 0 ? (
              <Text style={styles.empty}>All rent collected.</Text>
            ) : (
              pending.slice(0, 5).map((cycle) => (
                <Row
                  key={cycle._id}
                  icon="person-outline"
                  title={cycle.tenantId?.name || 'Tenant'}
                  subtitle={`${billLabel(cycle)} · ${money(cycle.amountDue - cycle.amountPaid)} pending`}
                  badge={cycle.status}
                  onPress={() => navigation.navigate('Rent', { propertyId })}
                />
              ))
            )}
          </QueryState>
        )}
      </QueryState>
      <Sheet visible={switching} onClose={() => setSwitching(false)} title="Your properties">
        {(properties.data || []).map((property) => (
          <Row
            key={property._id}
            icon="business-outline"
            title={property.name}
            subtitle={[property.ownerId === user?.id ? 'Owner' : 'Co-owner', property.city].filter(Boolean).join(' · ')}
            right={property._id === propertyId ? 'Current' : undefined}
            chevron={false}
            onPress={() => { setPropertyId(property._id); setSwitching(false); }}
          />
        ))}
        <SectionTitle>Add another property</SectionTitle>
        <Field label="Property name" placeholder="Enter property name" value={newProperty} onChangeText={setNewProperty} autoCapitalize="words" />
        <Button onPress={addProperty} loading={creating} disabled={!newProperty.trim()}>Add property</Button>
      </Sheet>
    </Screen>
  );
}

const ds = StyleSheet.create({
  overview: { backgroundColor: theme.ink, borderRadius: radius.xl, padding: 20, gap: 14, ...shadow.card },
  overviewFigures: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  overviewValue: { ...typography.display, fontSize: 48, lineHeight: 56, color: '#fff' },
  overviewPercent: { fontSize: 24, color: '#C7B8FF' },
  overviewTitle: { ...typography.bodyStrong, color: '#fff' },
  overviewMeta: { ...typography.caption, color: theme.inkMuted },
  overviewTrack: { height: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' },
  overviewFill: { height: '100%', backgroundColor: '#B7A5FF', borderRadius: 4 },
  grid: { flexDirection: 'row', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 19, color: theme.primaryText },
  setupIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' },
});
