import React, { useCallback, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Field, PageHeader, QueryState, Row, Screen, StateView, Stat, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { billLabel, money } from '../lib/format';

const REPORTS = {
  occupied: { title: 'Occupied beds', icon: 'people-outline', empty: 'No occupied beds', message: 'Occupied beds appear here when you assign tenants.' },
  vacant: { title: 'Vacant beds', icon: 'bed-outline', empty: 'No vacant beds', message: 'Add beds or check out a tenant to make a bed available.' },
  vacating: { title: 'Vacating soon', icon: 'exit-outline', empty: 'Nobody is vacating soon', message: 'Tenants with a planned move-out in the next 30 days appear here.' },
  rent: { title: 'Rent due', icon: 'wallet-outline', empty: 'All rent collected', message: 'There are no pending rent bills for this property.' },
};
const idOf = (value) => value?._id || value;
const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const location = (room, bed) => [room?.roomNumber && `Room ${room.roomNumber}`, bed?.bedLabel && `Bed ${bed.bedLabel}`].filter(Boolean).join(' · ');

export default function DashboardReportScreen({ navigation, route }) {
  const { api } = useAuth();
  const { propertyId, report = 'occupied' } = route.params;
  const config = REPORTS[report] || REPORTS.occupied;
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['dashboardReport', propertyId, report],
    queryFn: async () => {
      const [dashboard, beds, tenants] = await Promise.all([
        api.get(`/properties/${propertyId}/dashboard`),
        report === 'occupied' ? api.get('/beds', { params: { propertyId, status: 'OCCUPIED' } }) : null,
        report === 'occupied' || report === 'vacating' ? api.get('/tenants', { params: { propertyId } }) : null,
      ]);
      return { ...dashboard.data.data, beds: beds?.data.data || [], tenants: tenants?.data.data || [] };
    },
  });
  useFocusEffect(useCallback(() => { query.refetch(); }, [query.refetch]));

  const data = query.data || {};
  const tenantsByBed = new Map((data.tenants || []).filter(t => t.status === 'ACTIVE').map(t => [idOf(t.bedId), t]));
  const tenantsById = new Map((data.tenants || []).map(t => [t._id, t]));
  let rows = [];
  if (report === 'occupied' || report === 'vacant') {
    rows = (report === 'occupied' ? data.beds || [] : data.vacantBeds || []).map(bed => {
      const tenant = tenantsByBed.get(bed._id);
      return { key: bed._id, title: `Room ${bed.roomId?.roomNumber || '—'} · Bed ${bed.bedLabel}`,
        subtitle: tenant ? [tenant.name, tenant.phone, tenant.stayType === 'DAILY' ? `${money(tenant.dailyRate)}/day` : `${money(tenant.rentAmount)}/month`].filter(Boolean).join(' · ') : report === 'vacant' ? 'Available for a new tenant' : 'Occupied',
        badge: bed.status, roomId: idOf(bed.roomId), tenantId: tenant?._id };
    }).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  } else if (report === 'vacating') {
    rows = (data.vacatingSoon || []).map(t => {
      const tenant = tenantsById.get(t._id) || t;
      return { key: t._id, title: t.name, subtitle: [location(tenant.roomId, tenant.bedId), t.phone, `Moving out ${dateLabel(t.expectedVacateDate)}`].filter(Boolean).join(' · '), badge: 'ON_NOTICE', tenantId: t._id };
    });
  } else if (report === 'rent') {
    rows = (data.rentPending || []).map(cycle => ({ key: cycle._id, title: cycle.tenantId?.name || 'Tenant',
      subtitle: `${billLabel(cycle)} · Due ${dateLabel(cycle.dueDate)} · ${money(cycle.amountPaid)} paid of ${money(cycle.amountDue)}`,
      amount: Math.max(0, cycle.amountDue - cycle.amountPaid), badge: cycle.status, tenantId: idOf(cycle.tenantId) }));
  }
  const term = search.trim().toLowerCase();
  const shown = rows.filter(row => `${row.title} ${row.subtitle}`.toLowerCase().includes(term));
  const totalDue = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  function openRow(row) {
    if (row.tenantId) navigation.navigate('TenantDetail', { tenantId: row.tenantId });
    else if (row.roomId) navigation.navigate('RoomDetail', { roomId: row.roomId, propertyId });
  }

  return (
    <Screen scroll edges={['left', 'right']} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={theme.brand} colors={[theme.brand]} />}>
      <PageHeader eyebrow={data.property?.name || 'Property report'} title={config.title}
        subtitle={report === 'vacating' ? 'Planned move-outs in the next 30 days' : report === 'rent' ? 'All unpaid and partially paid bills' : 'All matching beds in this property'} />
      <QueryState query={query}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat icon={config.icon} label={report === 'rent' ? 'Pending bills' : report === 'vacating' ? 'Tenants vacating' : 'Beds'} value={rows.length} hint="Full property report" />
          {report === 'rent' && <Stat icon="cash-outline" label="Outstanding" value={money(totalDue)} tone={totalDue ? 'danger' : 'ok'} />}
        </View>
        {report === 'rent' && rows.length > 0 && <Button variant="secondary" onPress={() => navigation.navigate('Rent', { propertyId, initialView: 'pending' })}>Manage rent payments</Button>}
        {rows.length > 0 && <Field label="Search report" placeholder="Search by room, bed or tenant" value={search} onChangeText={setSearch} />}
        {term && <Text style={{ ...typography.caption, color: theme.textMuted }}>{shown.length} of {rows.length} results</Text>}
        {!shown.length ? <StateView icon={config.icon} title={term ? 'No matches' : config.empty} message={term ? 'Try another room, bed, name or mobile number.' : config.message} /> : shown.map(row => (
          <Row key={row.key} icon={config.icon} title={row.title} subtitle={row.subtitle} badge={row.badge}
            right={row.amount !== undefined ? money(row.amount) : undefined} onPress={row.tenantId || row.roomId ? () => openRow(row) : undefined} />
        ))}
      </QueryState>
    </Screen>
  );
}
