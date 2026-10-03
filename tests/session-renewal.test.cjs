const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const stitch = process.env.TEST_STITCH === '1';
function setup(status) {
  let handler, requests = 0, refreshes = 0, clears = 0;
  const api = Object.assign(async () => { requests++; return 'retried'; }, {
    interceptors: { request: { use() {} }, response: { use(ok, fail) { handler = fail; } } },
    defaults: { headers: { common: {} } },
    request: async () => { requests++; return 'retried'; },
  });
  const storage = { getToken: async () => 'current', getRefreshToken: async () => 'refresh', clearAll: async () => { clears++; }, setToken: async () => {}, setRefreshToken: async () => {} };
  const axios = { create: () => api, post: async () => { refreshes++; if (status) throw { response: { status } }; return { data: stitch ? { data: { token: 'next', refreshToken: 'next-refresh' } } : { accessToken: 'next', refreshToken: 'next-refresh' } }; } };
  const path = stitch ? 'services/api.js' : 'src/api/client.js';
  let source = fs.readFileSync(path, 'utf8').replace(/^import .*;\s*$/gm, '').replace(/export default api;/g, '').replace(/export /g, '');
  const context = { axios, storage, Constants: {}, Platform: { OS: 'android' }, process: { env: {} } };
  vm.createContext(context);
  vm.runInContext(source + (stitch ? '' : '\nbuildApi({getAccessToken:()=>"current",getRefreshToken:async()=>"refresh",setSession:async()=>{},clearSession:async()=>{clearCount();}});'), Object.assign(context, { clearCount: () => { clears++; } }));
  return { run: (token = 'current') => handler({ response: { status: 401 }, config: { url: '/private', headers: { Authorization: `Bearer ${token}` } } }), counts: () => ({ requests, refreshes, clears }) };
}
test('late 401 retries with already renewed token without rotating again', async () => {
  const s = setup(); await s.run('old'); assert.deepEqual(s.counts(), { requests: 1, refreshes: 0, clears: 0 });
});
for (const status of [429, 500, 503]) test(`refresh ${status} preserves saved session`, async () => {
  const s = setup(status); await assert.rejects(s.run()); assert.equal(s.counts().clears, 0);
});
test('refresh 401 clears rejected session', async () => {
  const s = setup(401); await assert.rejects(s.run()); assert.equal(s.counts().clears, 1);
});
test('successful renewal retries original request', async () => {
  const s = setup(); await s.run(); assert.deepEqual(s.counts(), { requests: 1, refreshes: 1, clears: 0 });
});
test('cold start preserves credentials on outage and restores on retry', async () => {
 const states=[], callbacks=[]; let index=0, clears=0, failing=true;
 const ctx={createContext:()=>({}),useRef:v=>({current:v}),useState:v=>{const i=index++;states[i]=v;return [v,next=>{states[i]=next;}];},useCallback:fn=>{callbacks.push(fn);return fn;},useEffect:()=>{},useMemo:()=>({}),SecureStore:{getItemAsync:async()=> 'saved-refresh',setItemAsync:async()=>{},deleteItemAsync:async()=>{clears++;}},axios:{post:async()=>{if(failing)throw {response:{status:503}};return {data:{accessToken:'new',refreshToken:'rotated'}};}},API_URL:'https://example.test',buildApi:()=>({})};
 const source=fs.readFileSync('src/context/AuthContext.js','utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'').replace(/return <AuthContext.Provider[^\n]+/,'return null;');
 vm.createContext(ctx);vm.runInContext(source+'\nAuthProvider({children:null});',ctx);
 const restore=callbacks[2];await restore();assert.equal(clears,0);assert.match(states[3],/Unable to restore/);failing=false;await restore();assert.equal(states[0],'new');assert.equal(states[3],'');assert.equal(clears,0);
});
