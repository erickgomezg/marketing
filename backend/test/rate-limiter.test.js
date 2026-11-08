import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/Presentation/Middlewares/rateLimiter.js';

function invoke(middleware, ip = '192.0.2.10') {
  const headers = {};
  let statusCode = 200;
  let nextCalled = false;
  const response = {
    set(name, value) { headers[name] = value; return this; },
    status(code) { statusCode = code; return this; },
    json() { return this; },
  };
  middleware({ ip, socket: { remoteAddress: ip } }, response, () => { nextCalled = true; });
  return { headers, statusCode, nextCalled };
}

test('rate limiter allows the configured number of requests and then returns 429', () => {
  const limit = createRateLimiter({ windowMs: 60000, max: 2 });
  assert.equal(invoke(limit).nextCalled, true);
  assert.equal(invoke(limit).nextCalled, true);
  const blocked = invoke(limit);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.headers['RateLimit-Remaining'], '0');
  assert.ok(Number(blocked.headers['Retry-After']) > 0);
});

test('rate limiter tracks client addresses independently', () => {
  const limit = createRateLimiter({ windowMs: 60000, max: 1 });
  assert.equal(invoke(limit, '192.0.2.10').nextCalled, true);
  assert.equal(invoke(limit, '192.0.2.11').nextCalled, true);
  assert.equal(invoke(limit, '192.0.2.10').statusCode, 429);
});

test('rate limiter rejects invalid configuration', () => {
  assert.throws(() => createRateLimiter({ windowMs: 0, max: 5 }), TypeError);
});
