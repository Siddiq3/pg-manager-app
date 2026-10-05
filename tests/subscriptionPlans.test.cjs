const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');

const source = readFileSync(require('node:path').join(__dirname, '../src/lib/subscriptionPlans.js'), 'utf8');
const load = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('the catalog matches the published plans', async () => {
  const { SUBSCRIPTION_PLANS } = await load;
  assert.deepEqual(
    SUBSCRIPTION_PLANS.map((p) => [p.id, p.monthlyPrice, p.properties, p.beds, p.coOwners, p.support]),
    [
      ['STARTER', 299, 1, 150, 0, 'Standard'],
      ['PRO', 699, 3, 450, 2, 'Standard'],
      ['GROWTH', 999, 10, 1000, 4, 'Priority'],
    ],
  );
});

test('the 30-day trial uses Starter limits; expired and co-owner states have no plan of their own', async () => {
  const { TRIAL_DAYS, currentPlan } = await load;
  assert.equal(TRIAL_DAYS, 30);
  assert.equal(currentPlan({ status: 'TRIAL' }).id, 'STARTER');
  assert.equal(currentPlan({ status: 'ACTIVE', plan: 'GROWTH' }).id, 'GROWTH');
  assert.equal(currentPlan({ status: 'ACTIVE', plan: 'PG Manager Pro' }).id, 'PRO', 'legacy plan names still resolve');
  assert.equal(currentPlan({ status: 'EXPIRED' }), null);
  assert.equal(currentPlan({ status: 'CO_OWNER' }), null);
});
