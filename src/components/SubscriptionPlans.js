import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card, Notice, Pill, SectionTitle, theme, typography } from './ui';
import { INCLUDED_FEATURES, PLAN_LIMIT_NOTE, SUBSCRIPTION_PLANS, TRIAL_DAYS, subscriptionPlan } from '../lib/subscriptionPlans';

export default function SubscriptionPlans({ entitlement }) {
  const current = entitlement?.status === 'ACTIVE' ? subscriptionPlan(entitlement.plan) : null;
  return <>
    <SectionTitle>Subscription plans</SectionTitle>
    <Text style={s.body}>{TRIAL_DAYS}-day free trial for new accounts.</Text>
    {entitlement?.status === 'CO_OWNER' && <Notice tone="muted" message="Your access is provided by the primary owner's subscription." />}
    {SUBSCRIPTION_PLANS.map((plan) => <Card key={plan.id} style={s.card}>
      <Text style={s.name}>{plan.name}</Text>
      {current?.id === plan.id && <Pill tone="ok">Current plan</Pill>}
      <Text style={s.price}>₹{plan.monthlyPrice}/month</Text>
      <Text style={s.body}>{plan.properties === 1 ? '1 property' : `Up to ${plan.properties} properties`} · {plan.beds.toLocaleString('en-IN')} total beds</Text>
      <Text style={s.body}>{plan.coOwners === 0 ? 'No co-owners' : `Up to ${plan.coOwners} co-owners`} · {plan.support} support</Text>
    </Card>)}
    <Text style={s.body}>{INCLUDED_FEATURES}</Text>
    <Notice tone="muted" icon="information-circle-outline" message={PLAN_LIMIT_NOTE} />
  </>;
}

const s = StyleSheet.create({
  card: { gap: 8 },
  name: { ...typography.h3, color: theme.text },
  price: { ...typography.h2, color: theme.primaryText },
  body: { ...typography.small, color: theme.textMuted },
});
