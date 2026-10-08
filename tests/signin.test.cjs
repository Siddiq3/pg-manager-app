const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = readFileSync(require('node:path').join(__dirname, '../src/lib/signin.js'), 'utf8');
const load = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('sign-in uses exactly two animated questions', async () => {
  const { SIGNIN_STEPS } = await load;
  assert.equal(SIGNIN_STEPS.length, 2);
  assert.ok(SIGNIN_STEPS[0].title);
  assert.ok(SIGNIN_STEPS[1].title);
});

test('sign-in only validates the active step', async () => {
  const { signinErrors } = await load;
  assert.deepEqual(signinErrors(0, { identifier: 'owner@example.com', password: '' }), {});
  assert.ok(signinErrors(0, { identifier: '  ', password: 'password' }).identifier);
  assert.ok(signinErrors(1, { identifier: 'owner@example.com', password: '' }).password);
  assert.deepEqual(signinErrors(1, { identifier: '', password: 'pass' }), {});
});

test('sign-in sends the existing API payload, trimming only the identifier', async () => {
  const { signinPayload } = await load;
  assert.deepEqual(signinPayload({ identifier: ' owner@example.com ', password: ' pass ' }),
    { identifier: 'owner@example.com', password: ' pass ' });
  assert.deepEqual(signinPayload({ identifier: ' 9876543210 ', password: 'abc' }),
    { identifier: '9876543210', password: 'abc' });
});
