import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Notice, Screen, theme, typography } from '../components/ui';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useAuth } from '../context/AuthContext';
import { TRIAL_DAYS } from '../lib/subscriptionPlans';

export default function SubscriptionRequiredScreen({ navigation }) {
  const { entitlement, logout, refreshEntitlement } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setMessage('');
    try {
      const state = await refreshEntitlement({ background: true });
      if (!state?.hasAccess) setMessage('No active subscription found yet. Try again after your subscription is active.');
    } catch {
      // AuthContext displays the subscription verification error screen.
    } finally { setRefreshing(false); }
  }

  return <Screen scroll>
    <View style={s.icon}><Ionicons name="lock-closed-outline" size={28} color={theme.brand} /></View>
    <Text style={s.title}>Subscription required</Text>
    <Text style={s.body}>Your trial or subscription has ended. New accounts receive a {TRIAL_DAYS}-day free trial.</Text>
    {entitlement?.trialEndsAt && <Text style={s.date}>Trial ended {new Date(entitlement.trialEndsAt).toLocaleDateString()}</Text>}
    <SubscriptionPlans entitlement={entitlement} />
    <Notice tone="muted" icon="information-circle-outline" message="Subscription purchases and billing are managed on the PG Manager website. After subscribing, refresh your status below or sign in again." />
    <Notice message={message} />
    <Button onPress={refresh} loading={refreshing}>Refresh subscription status</Button>
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
