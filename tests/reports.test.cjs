const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');

const source = readFileSync(require('node:path').join(__dirname, '../src/lib/reports.js'), 'utf8');
const load = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const asha = { _id: 't1', name: 'Asha', status: 'ACTIVE', stayType: 'MONTHLY', rentDueDay: 7, rentAmount: 6000 };
const ravi = { _id: 't2', name: 'Ravi', status: 'ACTIVE', stayType: 'MONTHLY', rentDueDay: 31, rentAmount: 5000 };
const guest = { _id: 't3', name: 'Guest', status: 'ACTIVE', stayType: 'DAILY', dailyRate: 500 };
const pay = (amount, date) => ({ amount, date });
const bills = [
  // Asha joined 7 Aug: Aug paid in Aug, Sep paid late in Oct, Oct partly paid.
  { _id: 'b1', tenantId: asha, month: '2026-08', dueDate: '2026-08-07T00:00:00.000Z', amountDue: 6000, amountPaid: 6000, payments: [pay(6000, '2026-08-07T06:00:00.000Z')] },
  { _id: 'b2', tenantId: asha, month: '2026-09', dueDate: '2026-09-07T00:00:00.000Z', amountDue: 6000, amountPaid: 6000, payments: [pay(6000, '2026-10-02T06:00:00.000Z')] },
  { _id: 'b3', tenantId: asha, month: '2026-10', dueDate: '2026-10-07T00:00:00.000Z', amountDue: 6000, amountPaid: 1000, payments: [pay(1000, '2026-10-07T06:00:00.000Z')] },
  // Ravi joined 31 Oct.
  { _id: 'b4', tenantId: ravi, month: '2026-10', dueDate: '2026-10-31T00:00:00.000Z', amountDue: 5000, amountPaid: 0, payments: [] },
  // A daily guest who checked in on the 2nd, unpaid.
  { _id: 'b5', tenantId: guest, month: '2026-10', dueDate: '2026-10-02T00:00:00.000Z', amountDue: 2000, amountPaid: 0, payments: [], stayType: 'DAILY' },
];

test('this month: bills, billed, pending, and money received in the month', async () => {
  const { monthSummary } = await load;
  const october = monthSummary(bills, '2026-10');
  assert.deepEqual(october.bills.map((b) => b._id), ['b5', 'b3', 'b4'], 'by due date');
  assert.equal(october.billed, 13000);
  assert.equal(october.pending, 5000 + 5000 + 2000);
  assert.equal(october.collected, 7000, "includes September's late payment");
});

test('overdue: unpaid bills past their due date', async () => {
  const { overdue } = await load;
  assert.deepEqual(overdue(bills, '2026-10-08').map((b) => b._id), ['b5', 'b3']);
  assert.deepEqual(overdue(bills, '2026-10-07').map((b) => b._id), ['b5'], 'due today is not overdue');
});

test('upcoming: open bills plus next bills worked out from the due day', async () => {
  const { upcoming } = await load;
  const items = upcoming(bills, '2026-10-08', 30);
  assert.deepEqual(items.map((i) => [i.tenant.name, i.date, i.amount, !!i.projected]), [
    ['Ravi', '2026-10-31', 5000, false],
    ['Asha', '2026-11-07', 6000, true],
  ]);
  // Ravi is due on the 31st: November has 30 days. A daily guest never gets a projected bill.
  const later = upcoming(bills, '2026-11-08', 30);
  assert.deepEqual(later.map((i) => [i.tenant.name, i.date]), [['Ravi', '2026-11-30'], ['Asha', '2026-12-07']]);
});

test('upcoming: nothing after the month a tenant is leaving in', async () => {
  const { upcoming } = await load;
  const leaving = { ...asha, expectedVacateDate: '2026-10-20T00:00:00.000Z' };
  const items = upcoming([{ ...bills[2], tenantId: leaving }], '2026-10-08', 30);
  assert.deepEqual(items, []);
});

test('history: last N months of billed and collected, with totals', async () => {
  const { history } = await load;
  const three = history(bills, '2026-10', 3);
  assert.deepEqual(three.rows, [
    { month: '2026-08', billed: 6000, collected: 6000 },
    { month: '2026-09', billed: 6000, collected: 0 },
    { month: '2026-10', billed: 13000, collected: 7000 },
  ]);
  assert.deepEqual([three.billed, three.collected], [25000, 13000]);
  assert.equal(history(bills, '2026-10', 12).rows[0].month, '2025-11');
});

test('IST: a payment at 20:00 UTC on 31 Oct counts in November', async () => {
  const { monthKey, dayKey } = await load;
  assert.equal(monthKey('2026-10-31T20:00:00.000Z'), '2026-11');
  assert.equal(dayKey('2026-10-31T20:00:00.000Z'), '2026-11-01');
});
