const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');

const source = readFileSync(require('node:path').join(__dirname, '../src/lib/subscriptionPlans.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function fixture({ plan = 'PRO', status = 'ACTIVE', owned = 3, beds = [150, 150, 150], members = {} } = {}) {
  const calls = [];
  const properties = Array.from({ length: owned }, (_, i) => ({ _id: `p${i}`, ownerId: 'owner' }));
  properties.push({ _id: 'borrowed', ownerId: 'other-owner' });
  const api = { get: async (url, options) => {
    calls.push([url, options]);
    if (url === '/billing/status') return { data: { entitlement: { plan, status, hasAccess: status !== 'EXPIRED' } } };
    if (url === '/properties') return { data: { data: properties } };
    if (url === '/beds') {
      const id = options.params.propertyId;
      assert.notEqual(id, 'borrowed', 'borrowed properties must not consume the owner plan');
      return { data: { data: Array.from({ length: beds[Number(id.slice(1))] || 0 }, () => ({})) } };
    }
    if (url.endsWith('/members')) return { data: { data: members[url.split('/')[2]] || [] } };
    throw new Error(`Unexpected read: ${url}`);
  } };
  return { api, userId: 'owner', calls };
}

test('all plan boundaries permit the last place and reject the next', async () => {
  const { SUBSCRIPTION_PLANS, checkPlanLimit, subscriptionPlan, TRIAL_DAYS } = await modulePromise;
  assert.equal(TRIAL_DAYS, 10);
  for (const plan of SUBSCRIPTION_PLANS) {
    for (const resource of ['properties', 'beds', 'coOwners']) {
      if (plan[resource]) assert.doesNotThrow(() => checkPlanLimit(plan, resource, plan[resource] - 1));
      assert.throws(() => checkPlanLimit(plan, resource, plan[resource]), /limit has been reached/);
    }
  }
  assert.equal(subscriptionPlan('PG Manager Pro').id, 'PRO');
  assert.equal(subscriptionPlan({ id: 'growth' }).id, 'GROWTH');
  assert.equal(subscriptionPlan('unknown'), null);
  assert.throws(() => checkPlanLimit(null, 'beds', 0), /could not be verified/);
});

test('property checks use fresh owned totals, excluding borrowed properties', async () => {
  const { assertSubscriptionAddition } = await modulePromise;
  await assert.rejects(assertSubscriptionAddition({ ...fixture(), resource: 'properties' }), /3 properties/);
  await assertSubscriptionAddition({ ...fixture({ owned: 2 }), resource: 'properties' });
});

test('bed limit spans all owned properties, including occupied beds', async () => {
  const { assertSubscriptionAddition } = await modulePromise;
  await assert.rejects(assertSubscriptionAddition({ ...fixture(), resource: 'beds', propertyId: 'p0' }), /450 total beds/);
  await assertSubscriptionAddition({ ...fixture({ beds: [150, 150, 149] }), resource: 'beds', propertyId: 'p0' });
});

test('co-owner limits count distinct people and pending invitations, excluding primary owners', async () => {
  const { assertSubscriptionAddition } = await modulePromise;
  const members = {
    p0: [{ email: 'owner@example.com', role: 'OWNER', status: 'ACTIVE' }, { email: 'a@example.com', role: 'CO_OWNER', status: 'ACTIVE' }],
    p1: [{ email: 'A@example.com', role: 'CO_OWNER', status: 'ACTIVE' }, { email: 'b@example.com', role: 'CO_OWNER', status: 'PENDING' }],
  };
  await assert.rejects(assertSubscriptionAddition({ ...fixture({ members }), resource: 'coOwners', propertyId: 'p0', email: 'c@example.com' }), /2 additional co-owners/);
  await assertSubscriptionAddition({ ...fixture({ members }), resource: 'coOwners', propertyId: 'p2', email: ' a@example.com ' });
  await assert.rejects(assertSubscriptionAddition({ ...fixture({ plan: 'STARTER', owned: 1 }), resource: 'coOwners', propertyId: 'p0', email: 'a@example.com' }), /0 additional co-owners/);
});

test('trial capacity stays unchanged and expired or unknown subscriptions cannot add owned resources', async () => {
  const { assertSubscriptionAddition } = await modulePromise;
  await assertSubscriptionAddition({ ...fixture({ status: 'TRIAL', plan: null, owned: 12 }), resource: 'properties' });
  for (const status of ['EXPIRED', 'CO_OWNER']) {
    await assert.rejects(assertSubscriptionAddition({ ...fixture({ status }), resource: 'properties' }), /active owner subscription/);
  }
  await assert.rejects(assertSubscriptionAddition({ ...fixture({ plan: 'unknown' }), resource: 'properties' }), /could not be verified/);
});

test('borrowed beds do not use the co-owner personal plan and membership failures stop additions', async () => {
  const { assertSubscriptionAddition } = await modulePromise;
  await assertSubscriptionAddition({ ...fixture({ plan: 'STARTER', status: 'CO_OWNER' }), resource: 'beds', propertyId: 'borrowed' });
  await assert.rejects(assertSubscriptionAddition({ ...fixture(), resource: 'beds', propertyId: 'missing' }), /no longer available/);
  await assert.rejects(assertSubscriptionAddition({ ...fixture(), resource: 'coOwners', propertyId: 'borrowed', email: 'a@example.com' }), /Only the primary owner/);
  await assert.rejects(assertSubscriptionAddition({ api: { get: async () => { throw new Error('Offline'); } }, userId: 'owner', resource: 'properties' }), /Offline/);
});
