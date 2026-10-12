const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/lib/access.js'), 'utf8').replace(/export /g, '') + '\nthis.can = can;', sandbox);
test('staff controls follow permissions; missing property access is denied', () => {
  assert.equal(sandbox.can(undefined, 'tenants.view'), false);
  assert.equal(sandbox.can({ role: 'STAFF', permissions: ['tenants.view'] }, 'tenants.view'), true);
  assert.equal(sandbox.can({ role: 'STAFF', permissions: ['tenants.view'] }, 'tenants.manage'), false);
  assert.equal(sandbox.can({ role: 'STAFF' }, 'rent.view'), false);
  assert.equal(sandbox.can({ role: 'OWNER' }, 'property.manage'), true);
  assert.equal(sandbox.can({ role: 'CO_OWNER' }, 'rent.manage'), true);
});
