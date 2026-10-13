import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Button, Card, Field, List, Notice, PageHeader, PasswordField, QueryState, Row, Screen, SectionTitle, theme, typography } from '../components/ui';
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
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [createLogin, setCreateLogin] = useState(true);
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
      if (editing) await api.patch(`/properties/${propertyId}/staff/${encodeURIComponent(editing.contact || editing.email)}`, { permissions });
      else if (createLogin) {
        const contact = email.trim();
        await api.post(`/properties/${propertyId}/staff/accounts`, { name: name.trim(), ...(contact.includes('@') ? { email: contact.toLowerCase() } : { phone: contact }), password, permissions });
      } else await api.post(`/properties/${propertyId}/staff`, { email: email.trim().toLowerCase(), permissions });
      setEmail(''); setName(''); setPassword(''); setPermissions([]); setEditing(null); await refresh();
      toast.success(editing ? 'Staff permissions updated.' : createLogin ? 'Staff login created. Share the mobile number or email and password with them.' : 'Invitation created. They join after signing in with their verified email.');
    } catch (error) { toast.error(errorMessage(error)); } finally { setBusy(false); }
  }
  function revoke(member) {
    Alert.alert('Remove staff access?', `${member.contact || member.email} will lose access to this property.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => {
      try { await api.delete(`/properties/${propertyId}/staff/${encodeURIComponent(member.contact || member.email)}`); await refresh(); if (editing?._id === member._id) { setEditing(null); setEmail(''); setPermissions([]); } toast.success('Staff access removed.'); }
      catch (error) { toast.error(errorMessage(error)); }
    } }]);
  }
  if (property?.role !== 'OWNER') return <Screen><QueryState query={query}><Notice message="Only the property owner can manage staff access." /></QueryState></Screen>;
  return <Screen scroll>
    <PageHeader title="Staff access" subtitle={property.name} />
    <Notice tone="muted" icon="information-circle-outline" message="Staff sign in with the login you create here. Access is limited to this property." />
    <SectionTitle>Staff members</SectionTitle>
    <QueryState query={members} empty="No staff invited yet.">
      {(members.data || []).map((member) => <List key={member._id}>
        <Row icon="person-outline" title={member.name || member.contact || member.email} subtitle={(member.permissions || []).map((p) => labels[p]).join(' · ') || 'No permissions assigned'} badge={member.status} />
        <View style={{ flexDirection: 'row', gap: 8, padding: 10 }}>
          <Button size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => { setEditing(member); setEmail(member.contact || member.email); setPermissions(member.permissions || []); }}>Edit permissions</Button>
          <Button size="sm" variant="danger" style={{ flex: 1 }} onPress={() => revoke(member)}>Remove</Button>
        </View>
      </List>)}
    </QueryState>
    <SectionTitle>{editing ? 'Edit staff permissions' : createLogin ? 'Create staff login' : 'Invite an existing account'}</SectionTitle>
    {!editing && <Button variant="secondary" onPress={() => { setCreateLogin(!createLogin); setEmail(''); setPassword(''); }}>{createLogin ? 'Invite by email instead' : 'Create mobile or email login instead'}</Button>}
    {!editing && createLogin && <Field label="Staff name" value={name} onChangeText={setName} autoCapitalize="words" />}
    <Field label={createLogin || editing ? 'Mobile number or email' : 'Staff email'} value={email} onChangeText={setEmail} editable={!editing} autoCapitalize="none" />
    {!editing && createLogin && <PasswordField label="Password for staff" value={password} onChangeText={setPassword} hint="8+ characters with uppercase, lowercase, number and symbol." />}
    {!editing && createLogin && <Notice tone="muted" message="Already have an account? Use Invite by email instead." />}
    <Card>{STAFF_PERMISSIONS.map((permission) => <View key={permission} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}><Text style={{ ...typography.body, color: theme.text, flex: 1 }}>{labels[permission]}</Text><Switch accessibilityLabel={labels[permission]} value={permissions.includes(permission)} onValueChange={(enabled) => toggle(permission, enabled)} /></View>)}</Card>
    <Text style={{ ...typography.caption, color: theme.textMuted }}>Dashboard access needs all four view permissions.</Text>
    <Button onPress={save} disabled={!email.trim() || (!editing && createLogin && (!name.trim() || !password))} loading={busy}>{editing ? 'Save permissions' : createLogin ? 'Create staff login' : 'Invite staff'}</Button>
    {editing && <Button variant="tertiary" onPress={() => { setEditing(null); setEmail(''); setPermissions([]); }}>Cancel editing</Button>}
  </Screen>;
}
