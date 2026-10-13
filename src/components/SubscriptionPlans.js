import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { List, Notice, Pill, SectionTitle, spacing, theme, typography } from './ui';
import { INCLUDED_FEATURES, PLAN_LIMIT_NOTE, SUBSCRIPTION_PLANS, currentPlan } from '../lib/subscriptionPlans';

export default function SubscriptionPlans({ entitlement }) {
  const current = currentPlan(entitlement);
  const onTrial = entitlement?.status === 'TRIAL';
  return <>
    <SectionTitle>Subscription plans</SectionTitle>
    {entitlement?.status === 'CO_OWNER' && <Notice tone="muted" message="Your access is provided by the primary owner's subscription." />}
    <List>
      {SUBSCRIPTION_PLANS.map((plan) => <View key={plan.id} style={s.plan}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={s.head}>
            <Text style={s.name}>{plan.name}</Text>
            {current?.id === plan.id && <Pill tone="ok">{onTrial ? 'Free trial' : 'Current'}</Pill>}
          </View>
          <Text style={s.body}>{plan.properties === 1 ? '1 property' : `${plan.properties} properties`} · {plan.beds.toLocaleString('en-IN')} beds · {plan.coOwners === 0 ? 'No co-owners' : `${plan.coOwners} co-owners`}</Text>
          <Text style={s.body}>{plan.staff === 1 ? '1 staff login' : `${plan.staff} staff logins`} · {plan.support} support</Text>
        </View>
        <Text style={s.price}>₹{plan.monthlyPrice}<Text style={s.per}>/mo</Text></Text>
      </View>)}
    </List>
    <Text style={s.body}>{INCLUDED_FEATURES} {PLAN_LIMIT_NOTE}</Text>
  </>;
}

const s = StyleSheet.create({
  plan: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md + 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.bodyStrong, color: theme.text },
  price: { ...typography.h3, color: theme.primaryText, fontVariant: ['tabular-nums'] },
  per: { ...typography.caption, color: theme.textMuted },
  body: { ...typography.caption, color: theme.textMuted },
});
