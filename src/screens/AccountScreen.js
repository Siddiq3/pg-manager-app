import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { Button, Card, Divider, Notice, Pill, Press, PageHeader, Screen, fonts, theme, typography, radius, spacing } from '../components/ui';

export default function AccountScreen({ navigation }) {
  const { user, logout, activePropertyId, entitlement, refreshEntitlement } = useAuth();
  const [refreshingPlan, setRefreshingPlan] = useState(false);
  async function refreshPlan() {
    if (refreshingPlan) return;
    setRefreshingPlan(true);
    try { await refreshEntitlement({ background: true }); }
    catch { /* AuthContext displays verification errors. */ }
    finally { setRefreshingPlan(false); }
  }
  const confirmLogout = () => Alert.alert('Sign out?', 'You will need to sign in again to manage your PG.', [
    { text: 'Stay', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: logout },
  ]);
  return (
    <Screen scroll>
      <PageHeader eyebrow="Your workspace" title="Account" subtitle="Your profile, property and preferences." />

      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'P').slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{user?.name || 'PG owner'}</Text>
          <Text style={styles.caption} numberOfLines={1}>{user?.email}</Text>
        </View>
      </Card>

      {entitlement?.status === 'TRIAL' && (
        <Notice tone="accent" icon="time-outline" message={`Free trial · ${entitlement.daysRemaining} day${entitlement.daysRemaining === 1 ? '' : 's'} remaining`} />
      )}

      <Group title="You">
        <Item icon="person-outline" label="Profile" value={user?.phone} onPress={() => navigation.navigate('Profile')} />
        {!user?.emailVerified && <Item icon="mail-unread-outline" label="Verify email" value={<Pill tone="warn">Recommended</Pill>} onPress={() => navigation.navigate('EmailVerification')} />}
        {activePropertyId && <Item icon="business-outline" label="Property settings" onPress={() => navigation.navigate('PropertySettings', { propertyId: activePropertyId })} />}
        <Item icon="lock-closed-outline" label="Password & devices" onPress={() => navigation.navigate('Security')} last />
      </Group>
      <SubscriptionPlans entitlement={entitlement} />
      <Button variant="secondary" onPress={refreshPlan} loading={refreshingPlan}>Refresh subscription status</Button>
      <Group title="Support">
        <Item icon="help-circle-outline" label="Help centre" onPress={() => navigation.navigate('Help')} />
        <Item icon="chatbubble-ellipses-outline" label="Contact support" onPress={() => navigation.navigate('Support')} />
        <Item icon="document-text-outline" label="Terms of service" onPress={() => navigation.navigate('Legal', { type: 'terms' })} />
        <Item icon="shield-outline" label="Privacy policy" onPress={() => navigation.navigate('Legal', { type: 'privacy' })} last />
      </Group>
      <Group title="Danger zone">
        <Item icon="person-remove-outline" label="Delete account" tone="danger" onPress={() => navigation.navigate('DeleteAccount')} last />
      </Group>

      <Press onPress={confirmLogout} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="Sign out" style={styles.logout}>
        <Ionicons name="log-out-outline" size={18} color={theme.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Press>
      <Text style={styles.version}>PG Manager · v0.1.0</Text>
    </Screen>
  );
}

function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title.toUpperCase()}</Text>
      <Card padded={false} style={styles.groupCard}>{children}</Card>
    </View>
  );
}

function Item({ icon, label, value, onPress, last, tone }) {
  const danger = tone === 'danger';
  return (
    <>
      <Press onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={label} style={styles.item}>
        <Ionicons name={icon} size={19} color={danger ? theme.danger : theme.textSecondary} />
        <Text style={[styles.itemLabel, danger && { color: theme.danger }]}>{label}</Text>
        {typeof value === 'string' ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : value}
        <Ionicons name="chevron-forward" size={17} color={theme.textDisabled} />
      </Press>
      {last ? null : <Divider style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: theme.text },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 21, color: theme.primaryText },
  name: { ...typography.bodyStrong, color: theme.text },
  caption: { ...typography.caption, color: theme.textMuted, marginTop: 2 },
  group: { gap: spacing.sm, marginTop: spacing.xs },
  groupTitle: { ...typography.caption, color: theme.textMuted, letterSpacing: 0.8 },
  groupCard: { overflow: 'hidden' },
  item: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  itemLabel: { ...typography.body, color: theme.text, flex: 1 },
  value: { ...typography.caption, color: theme.textMuted, maxWidth: '35%' },
  divider: { marginLeft: spacing.lg + 19 + spacing.md },
  logout: { minHeight: 52, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  logoutText: { ...typography.body, color: theme.danger },
  version: { ...typography.caption, color: theme.textDisabled, textAlign: 'center', paddingBottom: spacing.lg },
});
