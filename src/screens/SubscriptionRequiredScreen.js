import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Notice, Screen, theme, typography } from '../components/ui';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useAuth } from '../context/AuthContext';
import { TRIAL_DAYS } from '../lib/subscriptionPlans';

export default function SubscriptionRequiredScreen({ navigation }) {
  const { user, entitlement, logout, refreshEntitlement } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setMessage('');
    try {
      const state = await refreshEntitlement({ background: true });
      if (!state?.hasAccess) setMessage(user?.accountType === 'STAFF' ? 'No active property access found. Contact the property owner.' : 'No active subscription found yet. Try again after your subscription is active.');
    } catch {
      // AuthContext displays the subscription verification error screen.
    } finally { setRefreshing(false); }
  }

  return <Screen scroll>
    <View style={s.icon}><Ionicons name="lock-closed-outline" size={28} color={theme.brand} /></View>
    <Text style={s.title}>{user?.accountType === 'STAFF' ? 'Staff access unavailable' : 'Subscription required'}</Text>
    <Text style={s.body}>{user?.accountType === 'STAFF' ? 'Ask the property owner to restore your access or check their subscription. Staff do not need to buy a subscription.' : `Your trial or subscription has ended. New accounts receive a ${TRIAL_DAYS}-day free trial.`}</Text>
    {user?.accountType !== 'STAFF' && entitlement?.trialEndsAt && <Text style={s.date}>Trial ended {new Date(entitlement.trialEndsAt).toLocaleDateString()}</Text>}
    {user?.accountType !== 'STAFF' && <SubscriptionPlans entitlement={entitlement} />}
    {user?.accountType !== 'STAFF' && <Notice tone="muted" icon="information-circle-outline" message="Subscription purchases and billing are managed on the PG Manager website. After subscribing, refresh your status below or sign in again." />}
    <Notice message={message} />
    <Button onPress={refresh} loading={refreshing}>{user?.accountType === 'STAFF' ? 'Refresh access status' : 'Refresh subscription status'}</Button>
    <Button variant="danger" onPress={() => navigation.navigate('DeleteAccount')}>Delete account</Button>
    <Button variant="secondary" onPress={logout}>Sign out</Button>
  </Screen>;
}

const s = StyleSheet.create({
  icon: { width: 68, height: 68, borderRadius: 34, backgroundColor: theme.brandWeak, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: theme.text },
  body: { ...typography.body, color: theme.muted },
  date: { ...typography.caption, color: theme.textMuted },
});
