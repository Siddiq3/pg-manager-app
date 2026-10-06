const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');

const source = readFileSync(require('node:path').join(__dirname, '../src/lib/stay.js'), 'utf8');
const load = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('nights match the server: hotel-style, one-night minimum', async () => {
  const { stayNights, isDaily } = await load;
  assert.equal(stayNights('2026-10-01', '2026-10-03'), 2);
  assert.equal(stayNights('2026-10-01', '2026-10-01'), 1);
  assert.equal(stayNights('2026-01-30', '2026-02-02'), 3);
  assert.equal(stayNights('2026-10-01T00:00:00.000Z', '2026-10-05T00:00:00.000Z'), 4, 'server ISO dates');
  assert.equal(isDaily({ stayType: 'DAILY' }), true);
  assert.equal(isDaily({ stayType: 'MONTHLY' }), false);
});
