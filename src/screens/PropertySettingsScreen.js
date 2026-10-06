import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Notice, PageHeader, PasswordField, QueryState, Row, Screen, SectionTitle, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorMessage } from '../lib/format';
import { PLAN_LIMIT_NOTE, currentPlan } from '../lib/subscriptionPlans';

const emptyCoOwner = { name: '', email: '', phone: '', password: '' };

export default function PropertySettingsScreen({ route }) {
  const { propertyId } = route.params;
  const { api, user, entitlement } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [coOwner, setCoOwner] = useState(emptyCoOwner);
  const [busy, setBusy] = useState('');

  const properties = useQuery({ queryKey: ['properties'], queryFn: async () => (await api.get('/properties')).data.data });
  const members = useQuery({ queryKey: ['property-members', propertyId], queryFn: async () => (await api.get(`/properties/${propertyId}/members`)).data.data });
  const property = (properties.data || []).find((p) => p._id === propertyId);
  const isOwner = property?.ownerId === user?.id;
  const plan = currentPlan(entitlement);
  const onTrial = entitlement?.status === 'TRIAL';
  const noCoOwners = plan?.coOwners === 0;

  useEffect(() => {
    if (property) setForm({ name: property.name || '', address: property.address || '', city: property.city || '' });
  }, [property?._id]);

  async function save() {
    try {
      setBusy('save');
      await api.patch(`/properties/${propertyId}`, { name: form.name.trim(), address: form.address.trim(), city: form.city.trim() });
      await qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard', propertyId] });
      toast.success('Property updated.');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(''); }
  }

  async function addCoOwner() {
    if (busy) return;
    try {
      setBusy('co-owner');
      const { data } = await api.post(`/properties/${propertyId}/co-owners`, {
        name: coOwner.name.trim(), email: coOwner.email.trim(), phone: coOwner.phone.trim(), password: coOwner.password,
      });
      setCoOwner(emptyCoOwner);
      members.refetch();
      toast.success(data.outcome === 'INVITED'
        ? 'That email already has an account. They were invited and get access when they sign in.'
        : 'Co-owner added. They can sign in with this email and password.');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(''); }
  }

  const setField = (key) => (value) => setCoOwner((p) => ({ ...p, [key]: value }));
  const canAdd = coOwner.name.trim() && coOwner.email.trim() && coOwner.phone.trim() && coOwner.password;

  return (
    <Screen scroll>
      <PageHeader title="Property settings" subtitle={isOwner ? "Your property's details and who can manage it." : 'You are a co-owner of this property.'} />
      <QueryState query={properties}>
        <SectionTitle>Details</SectionTitle>
        <Field label="Property name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} autoCapitalize="words" editable={isOwner} />
        <Field label="Address" value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} autoCapitalize="words" editable={isOwner} />
        <Field label="City" value={form.city} onChangeText={(v) => setForm((p) => ({ ...p, city: v }))} autoCapitalize="words" editable={isOwner} />
        {isOwner ? <Button onPress={save} loading={busy === 'save'}>Save property</Button> : <Notice tone="muted" icon="information-circle-outline" message="Only the owner can change these details or add co-owners." />}
      </QueryState>

      <SectionTitle>Owners & access</SectionTitle>
      <QueryState query={members}>
        {(members.data || []).map((m) => (
          <Row key={m._id} icon="person-outline" title={m.name || m.email || 'Member'}
            subtitle={m.status === 'PENDING' ? 'Invite pending: they join when they sign in with this email' : (m.name ? m.email : undefined)} badge={m.role === 'CO_OWNER' ? 'Co-owner' : m.role} />
        ))}
      </QueryState>

      {isOwner && (
        <Card style={s.card}>
          <Text style={s.cardTitle}>Add a co-owner</Text>
          <Notice tone="muted" message={PLAN_LIMIT_NOTE} />
          {noCoOwners ? <Notice tone="muted" message={onTrial ? 'The free trial has Starter limits, which do not include co-owners. Pro includes up to 2 and Growth up to 4.' : 'Starter does not include co-owners. Pro includes up to 2 and Growth includes up to 4 additional co-owners across your subscription.'} /> : <>
          <Text style={s.cardBody}>Create a sign-in for a partner or manager. Share the email and password with them; they can change the password later from Password & devices.</Text>
          <Field label="Their name" value={coOwner.name} onChangeText={setField('name')} autoCapitalize="words" placeholder="Asha Rao" />
          <Field label="Their email" value={coOwner.email} onChangeText={setField('email')} keyboardType="email-address" placeholder="name@example.com" />
          <Field label="Their mobile number" value={coOwner.phone} onChangeText={setField('phone')} keyboardType="phone-pad" placeholder="9876543210" />
          <PasswordField label="Password for them" value={coOwner.password} onChangeText={setField('password')} hint="8+ characters with uppercase, lowercase, number and symbol." />
          <Button onPress={addCoOwner} loading={busy === 'co-owner'} disabled={!canAdd}>Add co-owner</Button>
          </>}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { gap: 14 },
  cardTitle: { ...typography.h3, color: theme.text },
  cardBody: { ...typography.small, color: theme.textMuted, marginTop: -6 },
});
