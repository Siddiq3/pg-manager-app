import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Button, Card, Field, Notice, PageHeader, QueryState, Row, Screen, SectionTitle, theme, typography } from '../components/ui';
import { usePropertyAccess } from '../components/PropertyAccess';
import { STAFF_PERMISSIONS } from '../lib/access';
import { errorMessage } from '../lib/format';
const labels = { 'tenants.view': 'View tenants', 'tenants.manage': 'Add, edit and check out tenants', 'beds.view': 'View rooms and beds', 'beds.manage': 'Add, edit and remove rooms and beds', 'rent.view': 'View rent and payment history', 'rent.manage': 'Record rent payments', 'reports.view': 'View reports' };
export default function StaffAccessScreen({ route }) {
  const { propertyId } = route.params;
  const { api } = useAuth();
  const { property, query } = usePropertyAccess(propertyId);
  const toast = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const members = useQuery({ queryKey: ['staff-access', propertyId], enabled: property?.role === 'OWNER', queryFn: async () => (await api.get(`/properties/${propertyId}/staff`)).data.data });
  function toggle(permission, enabled) {
    setPermissions((current) => {
      const next = new Set(current);
      if (enabled) { next.add(permission); if (permission.endsWith('.manage')) next.add(permission.replace('.manage', '.view')); }
      else { next.delete(permission); if (permission.endsWith('.view')) next.delete(permission.replace('.view', '.manage')); }
      return [...next];
    });
  }
  async function refresh() {
    await Promise.all([qc.invalidateQueries({ queryKey: ['staff-access', propertyId] }), qc.invalidateQueries({ queryKey: ['property-members', propertyId] }), qc.invalidateQueries({ queryKey: ['properties'] })]);
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      if (editing) await api.patch(`/properties/${propertyId}/staff/${encodeURIComponent(editing.email)}`, { permissions });
      else await api.post(`/properties/${propertyId}/staff`, { email: email.trim().toLowerCase(), permissions });
      setEmail(''); setPermissions([]); setEditing(null); await refresh();
      toast.success(editing ? 'Staff permissions updated.' : 'Invitation created. They join after signing in with their verified email.');
    } catch (error) { toast.error(errorMessage(error)); } finally { setBusy(false); }
  }
  function revoke(member) {
    Alert.alert('Remove staff access?', `${member.email} will lose access to this property.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => {
      try { await api.delete(`/properties/${propertyId}/staff/${encodeURIComponent(member.email)}`); await refresh(); if (editing?.email === member.email) { setEditing(null); setEmail(''); setPermissions([]); } toast.success('Staff access removed.'); }
      catch (error) { toast.error(errorMessage(error)); }
    } }]);
  }
  if (property?.role !== 'OWNER') return <Screen><QueryState query={query}><Notice message="Only the property owner can manage staff access." /></QueryState></Screen>;
  return <Screen scroll>
    <PageHeader title="Staff access" subtitle={property.name} />
    <Notice tone="muted" message="Access applies only to this property. Ask staff to register or sign in and verify the email shown here. Salary records are managed separately." />
    <SectionTitle>Staff members</SectionTitle>
    <QueryState query={members} empty="No staff invited yet.">
      {(members.data || []).map((member) => <Card key={member._id}>
        <Row icon="person-outline" title={member.email} subtitle={(member.permissions || []).map((p) => labels[p]).join(' · ') || 'No permissions assigned'} badge={member.status} />
        <Button variant="secondary" onPress={() => { setEditing(member); setEmail(member.email); setPermissions(member.permissions || []); }}>Edit permissions</Button>
        <Button variant="danger" onPress={() => revoke(member)}>Remove access</Button>
      </Card>)}
    </QueryState>
    <SectionTitle>{editing ? 'Edit staff permissions' : 'Invite staff'}</SectionTitle>
    <Field label="Staff email" value={email} onChangeText={setEmail} editable={!editing} keyboardType="email-address" autoCapitalize="none" />
    <Card>{STAFF_PERMISSIONS.map((permission) => <View key={permission} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}><Text style={{ ...typography.body, color: theme.text, flex: 1 }}>{labels[permission]}</Text><Switch accessibilityLabel={labels[permission]} value={permissions.includes(permission)} onValueChange={(enabled) => toggle(permission, enabled)} /></View>)}</Card>
    <Notice tone="muted" message="The dashboard requires all four view permissions: tenants, beds, rent and reports. Staff with fewer permissions use their assigned sections." />
    <Button onPress={save} disabled={!email.trim()} loading={busy}>{editing ? 'Save permissions' : 'Invite staff'}</Button>
    {editing && <Button variant="tertiary" onPress={() => { setEditing(null); setEmail(''); setPermissions([]); }}>Cancel editing</Button>}
  </Screen>;
}
