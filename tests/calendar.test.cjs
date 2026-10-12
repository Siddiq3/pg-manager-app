const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(file, dependencies = {}) {
  const exports = {};
  const source = require('@babel/core').transformSync(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { filename: file, presets: ['babel-preset-expo'] }).code;
  vm.runInNewContext(source, { exports, require: name => name.startsWith('@babel/runtime/') ? require(name) : dependencies[name] });
  return exports;
}
const calendar = load('src/lib/calendar.js');
const finance = load('src/lib/finance.js');

test('calendar handles leap years, blank week cells and year boundaries', () => {
  assert.equal(calendar.calendarDays('2024-02').filter(Boolean).length, 29);
  assert.equal(calendar.calendarDays('2023-02').filter(Boolean).length, 28);
  assert.equal(calendar.calendarDays('2026-02')[0], '2026-02-01');
  assert.equal(calendar.calendarDays('2026-10')[0], null);
  assert.equal(calendar.calendarDays('2026-10')[4], '2026-10-01');
  assert.equal(finance.shiftMonth('2026-12', 1), '2027-01');
  for (const day of ['2026-02-29', '2026-04-31', '2026-13-01', '']) assert.equal(calendar.validDay(day), false);
  assert.equal(calendar.validDay('2024-02-29'), true);
  assert.equal(calendar.dateLabel('2026-10-13'), '13 October 2026');
});

function picker(props) {
  const states = []; let index = 0;
  const react = { useState: initial => { const i = index++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = v; }]; } };
  const jsx = (type, props) => ({ type, props });
  const { DateField } = load('src/components/DateField.js', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Keyboard: { dismiss() {} }, StyleSheet: { create: v => v } },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    './ui': { Press: 'Press', Button: 'Button', radius: {}, theme: {}, typography: {} },
    './Sheet': { Sheet: 'Sheet' }, '../lib/calendar': calendar, '../lib/finance': finance,
  });
  let tree;
  function render() { index = 0; tree = DateField(props); }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(n => nodes(n));
    return [node, ...nodes(node.props?.children)];
  }
  function find(label) {
    const all = nodes(tree);
    const node = all.find(n => n.props?.accessibilityLabel === label) || all.find(n => n.props?.children === label);
    assert.ok(node, `Missing control ${label}`); return node;
  }
  function click(label) { find(label).props.onPress(); render(); }
  render();
  return { click, find, sheet: () => nodes(tree).find(n => n.type === 'Sheet') };
}

test('date selection waits for confirmation; cancel, clear and read-only retain their meaning', () => {
  const changes = [];
  const p = picker({ label: 'Joining date', value: '2026-10-13', onChange: v => changes.push(v), optional: true });
  p.click('Joining date: 13 October 2026');
  p.click('22 October 2026');
  assert.deepEqual(changes, []);
  p.sheet().props.onClose();
  p.click('Joining date: 13 October 2026');
  p.click('22 October 2026');
  p.click('Use this date');
  assert.deepEqual(changes, ['2026-10-22']);
  p.click('Joining date: 13 October 2026'); p.click('Clear date');
  assert.deepEqual(changes, ['2026-10-22', '']);
  const locked = picker({ label: 'Joining date', value: '2026-10-13', editable: false, onChange: () => assert.fail('Read-only changed') });
  locked.click('Joining date: 13 October 2026');
  assert.equal(locked.sheet().props.visible, false);
});

test('check-out lower bounds and month-only selection preserve API formats', () => {
  const p = picker({ label: 'Check-out', value: '2026-10-13', minDate: '2026-10-13', onChange() {} });
  p.click('Check-out: 13 October 2026');
  assert.equal(p.find('12 October 2026').props.disabled, true);
  assert.equal(p.find('13 October 2026').props.disabled, false);
  let selected;
  const m = picker({ label: 'Effective month', mode: 'month', value: '2026-10', onChange: v => { selected = v; } });
  m.click('Effective month: October 2026'); m.click('Next year'); m.click('June'); m.click('Use this month');
  assert.equal(selected, '2027-06');
});
