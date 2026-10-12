const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { QueryClient } = require('@tanstack/react-query');

test('switching accounts clears private query data; changing password retains the replacement session', async () => {
  const cache = new QueryClient();
  const values = [];
  const storage = new Map();
  let response;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (_, props) => props,
    useState: (initial) => { const index = values.push(initial) - 1; return [initial, (value) => { values[index] = value; }]; },
    useRef: (current) => ({ current }),
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
  };
  const api = { post: async () => ({ data: response }) };
  const modules = {
    react,
    'react/jsx-runtime': { jsx: (_, props) => props },
    '@tanstack/react-query': { useQueryClient: () => cache },
    'expo-secure-store': { setItemAsync: async (key, value) => storage.set(key, value), deleteItemAsync: async (key) => storage.delete(key) },
    '@react-native-async-storage/async-storage': { removeItem: async () => {}, setItem: async () => {} },
    axios: api,
    '../api/client': { API_URL: 'http://localhost/api/v1', buildApi: () => api },
  };
  const source = require('@babel/core').transformSync(fs.readFileSync(require.resolve('../src/context/AuthContext.js'), 'utf8'), { filename: 'AuthContext.js', presets: ['babel-preset-expo'] }).code;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => { if (name.startsWith('@babel/runtime/')) return require(name); if (!(name in modules)) throw new Error(name); return modules[name]; } });
  const auth = exports.AuthProvider({ children: null }).value;
  cache.setQueryData(['properties'], [{ _id: 'owner-private' }]);
  cache.setQueryData(['tenantCycles', 'tenant'], [{ amountPaid: 5000 }]);
  response = { user: { id: 'staff' }, accessToken: 'staff-access', refreshToken: 'staff-refresh' };
  await auth.login({ identifier: '9888800011', password: 'Str0ng!Login99' });
  assert.equal(cache.getQueryCache().getAll().length, 0);
  assert.ok(values.includes('staff-access'));
  assert.equal(storage.get('pg_manager_refresh_token'), 'staff-refresh');
  cache.setQueryData(['properties'], [{ _id: 'staff-assigned' }]);
  response = { user: { id: 'staff' }, accessToken: 'changed-access', refreshToken: 'changed-refresh' };
  await auth.changePassword({ currentPassword: 'Str0ng!Login99', newPassword: 'Changed!Login88' });
  assert.ok(values.includes('changed-access'));
  assert.equal(storage.get('pg_manager_refresh_token'), 'changed-refresh');
  assert.equal(cache.getQueryData(['properties'])[0]._id, 'staff-assigned');
  await auth.clearSession();
  assert.equal(cache.getQueryCache().getAll().length, 0);
  assert.equal(storage.has('pg_manager_refresh_token'), false);
});
