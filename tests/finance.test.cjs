const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = readFileSync(require('node:path').join(__dirname, '../src/lib/finance.js'), 'utf8');
const load = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('finance amount inputs convert exact decimal strings to bounded integer paise', async () => {
  const { paise } = await load;
  assert.equal(paise('18000'), 1800000);
  assert.equal(paise('0.01'), 1);
  assert.equal(paise('500.25'), 50025);
  for (const value of ['', '-1', '0', '1.234', '1e3', 'Infinity', '1000000.01']) assert.throws(() => paise(value));
});
test('finance currency displays paise and negative remaining balances', async () => {
  const { moneyPaise, rupeeInput } = await load;
  assert.equal(moneyPaise(12000025), '₹1,20,000.25');
  assert.equal(moneyPaise(-501), '-₹5.01');
  assert.equal(rupeeInput(50025), '500.25');
});
test('month selection handles year rollover without local timezone drift', async () => {
  const { shiftMonth } = await load;
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('payment dates use IST midnight and reject nonexistent calendar dates', async () => {
  const { paymentDate } = await load;
  assert.equal(paymentDate('2026-10-01'), '2026-10-01T00:00:00+05:30');
  assert.throws(() => paymentDate('2026-02-30'));
});
test('daily wage input requires explicit whole days', async () => {
  const { workDays } = await load;
  assert.equal(workDays('12'), 12);
  assert.equal(workDays('0'), 0);
  for (const value of ['', '-1', '1.5', '32']) assert.throws(() => workDays(value));
});
test('submission identifiers are valid UUIDs and separate distinct forms', async () => {
  const { submissionId } = await load;
  const ids = Array.from({ length: 100 }, submissionId);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});
