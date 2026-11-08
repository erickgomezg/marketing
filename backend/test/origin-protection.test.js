import test from 'node:test';
import assert from 'node:assert/strict';
import { createOriginProtection } from '../src/Presentation/Middlewares/originProtection.js';

function invoke(middleware, { method = 'POST', origin, cookie = 'amm_access=token' } = {}) {
  let statusCode = 200;
  let nextCalled = false;
  const response = { status(code) { statusCode = code; return this; }, json() { return this; } };
  const request = { method, cookies: cookie ? { amm_access: cookie } : {}, get(name) { return name.toLowerCase() === 'origin' ? origin : undefined; } };
  middleware(request, response, () => { nextCalled = true; });
  return { statusCode, nextCalled };
}

test('origin protection accepts configured same-origin requests', () => {
  const middleware = createOriginProtection({ allowedOrigins: new Set(['https://marketing.example.com']) });
  assert.equal(invoke(middleware, { origin: 'https://marketing.example.com' }).nextCalled, true);
});

test('origin protection rejects cross-origin cookie-authenticated mutations', () => {
  const middleware = createOriginProtection({ allowedOrigins: new Set(['https://marketing.example.com']) });
  assert.equal(invoke(middleware, { origin: 'https://attacker.example' }).statusCode, 403);
});

test('origin protection rejects missing Origin on cookie-authenticated mutations', () => {
  const middleware = createOriginProtection({ allowedOrigins: new Set(['https://marketing.example.com']) });
  assert.equal(invoke(middleware).statusCode, 403);
});

test('origin protection allows safe methods and bearer-only requests', () => {
  const middleware = createOriginProtection({ allowedOrigins: new Set(['https://marketing.example.com']) });
  assert.equal(invoke(middleware, { method: 'GET' }).nextCalled, true);
  assert.equal(invoke(middleware, { cookie: null }).nextCalled, true);
});
