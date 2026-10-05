// The free trial gives Starter's limits for its whole length. Limits are enforced by the
// server on every addition; the app only shows them (no extra pre-check requests).
export const TRIAL_DAYS = 30;
export const TRIAL_PLAN_ID = 'STARTER';

export const SUBSCRIPTION_PLANS = Object.freeze([
  Object.freeze({ id: 'STARTER', name: 'Starter', monthlyPrice: 299, properties: 1, beds: 150, coOwners: 0, support: 'Standard' }),
  Object.freeze({ id: 'PRO', name: 'Pro', monthlyPrice: 699, properties: 3, beds: 450, coOwners: 2, support: 'Standard' }),
  Object.freeze({ id: 'GROWTH', name: 'Growth', monthlyPrice: 999, properties: 10, beds: 1000, coOwners: 4, support: 'Priority' }),
]);

export const INCLUDED_FEATURES = 'All plans include room, bed and tenant management, occupancy, rent tracking, payment and deposit records, plus web and Android access.';
export const PLAN_LIMIT_NOTE = 'Property, bed and co-owner limits apply across your subscription. Co-owners are additional to the primary owner.';

export function subscriptionPlan(value) {
  const name = typeof value === 'string' ? value : value?.id || value?.name;
  const id = String(name || '').trim().replace(/^PG Manager\s+/i, '').toUpperCase();
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) || null;
}

/** The plan whose limits apply now: the paid plan, Starter during the trial, otherwise none. */
export function currentPlan(entitlement) {
  if (entitlement?.status === 'ACTIVE') return subscriptionPlan(entitlement.plan);
  if (entitlement?.status === 'TRIAL') return subscriptionPlan(TRIAL_PLAN_ID);
  return null;
}
