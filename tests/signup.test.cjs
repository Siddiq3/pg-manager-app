const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const source = readFileSync(require('node:path').join(__dirname, '../src/lib/signup.js'), 'utf8');
const load = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const valid = { email: 'owner@example.com', name: 'PG Owner', phone: '9876543210', password: 'Str0ng!Pass', confirmPassword: 'Str0ng!Pass' };

test('signup validates only the current question and blocks invalid contact details', async () => {
  const { signupErrors } = await load;
  assert.deepEqual(signupErrors(0, { ...valid, name: '', phone: '', password: '' }), {});
  assert.ok(signupErrors(0, { ...valid, email: 'owner@' }).email);
  assert.ok(signupErrors(1, { ...valid, name: '123' }).name);
  assert.ok(signupErrors(2, { ...valid, phone: '12345' }).phone);
  assert.deepEqual(signupErrors(1, { ...valid, name: 'సిద్దిక్' }), {});
  assert.deepEqual(signupErrors(2, { ...valid, phone: '+91 98765 43210' }), {});
});
test('signup prevents weak, mismatched and oversized passwords before submission', async () => {
  const { signupErrors } = await load;
  assert.ok(signupErrors(3, { ...valid, password: 'password' }).password);
  assert.ok(signupErrors(3, { ...valid, confirmPassword: 'Different!1' }).confirmPassword);
  assert.ok(signupErrors(3, { ...valid, password: 'Aa1!' + '😀'.repeat(18) }).password);
  assert.deepEqual(signupErrors(3, valid), {});
});
test('signup preserves draft values and submits the existing API shape', async () => {
  const { SIGNUP_STEPS, signupPayload } = await load;
  assert.deepEqual(SIGNUP_STEPS.flatMap(s => s.fields), ['email', 'name', 'phone', 'password', 'confirmPassword']);
  const draft = { ...valid, name: ' PG Owner ', email: ' OWNER@example.com ', phone: ' 9876543210 ', password: ' Str0ng!Pass ', confirmPassword: ' Str0ng!Pass ' };
  const payload = signupPayload(draft);
  assert.equal(payload.email, 'owner@example.com');
  assert.equal(payload.name, 'PG Owner');
  assert.equal(payload.phone, '9876543210');
  assert.equal(payload.password, draft.password);
  assert.equal(draft.name, ' PG Owner ');
  assert.deepEqual(Object.keys(payload).sort(), ['confirmPassword', 'email', 'name', 'password', 'phone']);
});
