import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionService } from '../src/Application/Services/SessionService.js';

const userId = '65ab32dc-162f-4f50-b9b5-8f6c8719cc08';
const sessionId = '65ab32dc-162f-4f50-b9b5-8f6c8719cc09';

function setup({ recordset = [{ SessionId: sessionId, UserId: userId, AuthVersion: 3, Email: 'admin@example.test', DisplayName: 'Admin', Role: 'Administrador' }] } = {}) {
  const calls = [];
  const service = new SessionService({
    sessionRepository: { execute: async (action, values) => { calls.push({ action, values }); return { recordset }; } },
    tokenService: { issue: (...args) => `access:${args.join(':')}`, lifetimeSeconds: () => 900 },
  });
  return { service, calls };
}

test('session creation persists only a SHA-256 refresh token hash', async () => {
  const { service, calls } = setup();
  const result = await service.create({ UserId: userId, AuthVersion: 3 });
  assert.equal(calls[0].action, 'create');
  assert.equal(calls[0].values.userId, userId);
  assert.equal(calls[0].values.tokenHash.length, 32);
  assert.notEqual(calls[0].values.tokenHash.toString('base64url'), result.refreshToken);
  assert.equal(result.accessToken, `access:${userId}:3:${result.sessionId}`);
  assert.equal(result.refreshExpiresInSeconds, 604800);
});

test('refresh rotation replaces the token hash and returns a new access token', async () => {
  const { service, calls } = setup();
  const result = await service.rotate('a'.repeat(43));
  assert.equal(calls[0].action, 'rotate');
  assert.equal(calls[0].values.tokenHash.length, 32);
  assert.equal(calls[0].values.newTokenHash.length, 32);
  assert.notDeepEqual(calls[0].values.tokenHash, calls[0].values.newTokenHash);
  assert.notEqual(result.refreshToken, 'a'.repeat(43));
  assert.equal(result.accessToken, `access:${userId}:3:${sessionId}`);
  assert.equal(result.user.role, 'Administrador');
});

test('refresh rotation rejects a missing database session', async () => {
  const { service } = setup({ recordset: [] });
  await assert.rejects(service.rotate('a'.repeat(43)), { code: 'INVALID_REFRESH_TOKEN' });
});

test('refresh rejects malformed tokens before calling SQL', async () => {
  const { service, calls } = setup();
  await assert.rejects(service.rotate('short'), { code: 'INVALID_REFRESH_TOKEN' });
  assert.equal(calls.length, 0);
});
