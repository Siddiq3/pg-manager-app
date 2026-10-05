export const TRIAL_DAYS = 10;

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

export function checkPlanLimit(plan, resource, count, additional = 1) {
  if (!plan) throw new Error('Your subscription plan could not be verified. Refresh your subscription status in Account and try again.');
  if (count + additional > plan[resource]) {
    const label = { properties: 'properties', beds: 'total beds', coOwners: 'additional co-owners' }[resource];
    throw new Error(`${plan.name} allows ${plan[resource].toLocaleString('en-IN')} ${label} across your subscription. Your subscription limit has been reached.`);
  }
}

// Pending invites reserve a place. The same person on several properties counts once.
export function coOwnerEmails(memberLists) {
  return new Set(memberLists.flat()
    .filter((member) => member.role === 'CO_OWNER' && ['ACTIVE', 'PENDING'].includes(member.status))
    .map((member) => String(member.email).trim().toLowerCase()));
}

// Fresh reads before each addition keep limits independent of the selected property.
// Trial capacity stays unchanged. Borrowed properties belong to their primary owner's
// subscription; this client cannot read that owner's private billing or other properties.
export async function assertSubscriptionAddition({ api, userId, resource, propertyId, email }) {
  if (!['properties', 'beds', 'coOwners'].includes(resource)) throw new Error('Unknown subscription limit.');
  if (!userId) throw new Error('Sign in again to verify your subscription.');
  const { data: { entitlement } } = await api.get('/billing/status');
  const { data: { data: properties } } = await api.get('/properties');
  const owned = properties.filter((property) => property.ownerId === userId);
  if (resource === 'beds') {
    const property = properties.find((item) => item._id === propertyId);
    if (!property) throw new Error('This property is no longer available. Refresh and try again.');
    if (property.ownerId !== userId) return;
  }
  if (resource === 'coOwners' && !owned.some((property) => property._id === propertyId)) {
    throw new Error('Only the primary owner can add co-owners.');
  }
  if (!entitlement?.hasAccess || entitlement.status === 'CO_OWNER') {
    throw new Error('An active owner subscription is required to add to your own properties.');
  }
  if (entitlement.status === 'TRIAL') return;
  const plan = subscriptionPlan(entitlement.plan);
  if (resource === 'properties') return checkPlanLimit(plan, resource, owned.length);
  if (resource === 'beds') {
    const lists = await Promise.all(owned.map(async (property) =>
      (await api.get('/beds', { params: { propertyId: property._id } })).data.data));
    return checkPlanLimit(plan, resource, lists.reduce((total, beds) => total + beds.length, 0));
  }
  const lists = await Promise.all(owned.map(async (property) =>
    (await api.get(`/properties/${property._id}/members`)).data.data));
  const emails = coOwnerEmails(lists);
  return checkPlanLimit(plan, resource, emails.size, emails.has(email.trim().toLowerCase()) ? 0 : 1);
}
