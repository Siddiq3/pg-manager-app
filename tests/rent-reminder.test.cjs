const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function load(name, dependencies = {}) {
  const exports = {};
  const source = babel.transformSync(fs.readFileSync(require.resolve(`../src/lib/${name}.js`), 'utf8'), { filename: `${name}.js`, presets: ['babel-preset-expo'] }).code;
  vm.runInNewContext(source, { exports, require: name => name.startsWith('@babel/runtime/') ? require(name) : dependencies[name] });
  return exports;
}
const { rentReminder, whatsappNumber } = load('rentReminder', { './format': load('format') });

test('WhatsApp numbers normalize Indian local numbers and preserve international country codes', () => {
  for (const number of ['98888 00501', '+91 98888-00501', '09888800501', '00919888800501']) assert.equal(whatsappNumber(number), '919888800501');
  assert.equal(whatsappNumber('+1 (415) 555-2671'), '14155552671');
  assert.equal(whatsappNumber('+65 8123 4567'), '6581234567');
  for (const number of ['', '123', '+012345678901', '98888wrong00501', '++919888800501']) assert.throws(() => whatsappNumber(number));
});

test('reminder encodes tenant, property, IST due date and exact remaining balance', () => {
  const result = rentReminder({ amountDue: 6000, amountPaid: 1500.5, month: '2026-10', dueDate: '2026-10-04T20:00:00Z' }, { name: 'A & B', phone: '9888800501' }, 'Sai & Sons PG');
  assert.match(result.message, /₹4,499\.50/);
  assert.match(result.message, /5 October 2026/);
  assert.match(result.message, /Oct 2026/);
  const url = new URL(result.url);
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/919888800501');
  assert.equal(url.searchParams.get('text'), result.message);
  assert.match(result.message, /A & B/);
  assert.match(result.message, /Sai & Sons PG/);
});

test('paid or refund bills cannot produce a due reminder; daily stays use their own bill label', () => {
  for (const amountPaid of [6000, 6500]) assert.throws(() => rentReminder({ amountDue: 6000, amountPaid }, { phone: '9888800501' }));
  const result = rentReminder({ amountDue: 1500, amountPaid: 500, stayType: 'DAILY', nights: 3, dailyRate: 500, dueDate: '2026-10-13T00:00:00Z' }, { name: 'Daily Guest', phone: '+919888800501' });
  assert.match(result.message, /Stay · 3 days/);
  assert.match(result.message, /₹1,000\.00/);
});
