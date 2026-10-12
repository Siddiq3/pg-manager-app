import React, { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Notice, theme, typography } from './ui';
import { Sheet } from './Sheet';
import { rentReminder } from '../lib/rentReminder';

export function RentReminderButton({ cycle, tenant, propertyName }) {
  const [preview, setPreview] = useState(null);
  const [opening, setOpening] = useState(false);
  if (!(Number(cycle.amountDue) - Number(cycle.amountPaid) > 0)) return null;
  function prepare() {
    try { setPreview(rentReminder(cycle, tenant, propertyName)); }
    catch (e) { Alert.alert('Cannot prepare reminder', e.message); }
  }
  async function share() {
    if (!preview || opening) return;
    setOpening(true);
    try {
      // Recalculate from current props so an updated bill cannot reuse an old balance.
      const current = rentReminder(cycle, tenant, propertyName);
      if (current.message !== preview.message || current.phone !== preview.phone) { setPreview(current); return; }
      await Linking.openURL(current.url);
      setPreview(null);
    } catch (e) {
      const message = e?.message || '';
      Alert.alert('Could not open WhatsApp', message.startsWith('Add ') || message.startsWith('This bill') ? message : 'Make sure WhatsApp is installed, then try again.');
    } finally { setOpening(false); }
  }
  return <>
    <Button variant="secondary" onPress={prepare} icon={<Ionicons name="logo-whatsapp" size={20} color={theme.primary} />}>Share due on WhatsApp</Button>
    <Sheet visible={!!preview} title="Rent reminder" onClose={() => !opening && setPreview(null)}>
      <Text style={{ ...typography.label, color: theme.textSecondary }}>To: {tenant?.name || 'Tenant'} · +{preview?.phone}</Text>
      <Text selectable style={{ ...typography.body, color: theme.text }}>{preview?.message}</Text>
      <Notice tone="muted" message="Review the reminder, then tap Send in WhatsApp." />
      <Button loading={opening} onPress={share}>Open WhatsApp</Button>
    </Sheet>
  </>;
}
