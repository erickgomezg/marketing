import test from 'node:test';
import assert from 'node:assert/strict';
import { MetaConnectionService } from '../src/Application/Services/MetaConnectionService.js';

test('Meta OAuth state is signed, scoped to a business and expires', () => {
  process.env.AUTH_JWT_SECRET = 'unit-test-secret-with-at-least-32-characters';
  const provider = { createAuthorizationUrl: ({ state }) => `https://facebook.test/oauth?state=${state}`, scopes: () => [] };
  const service = new MetaConnectionService({
    provider,
    repository: { save: async () => ({}) },
    encryptor: { encrypt: (value) => value },
  });
  const { state, url } = service.authorizationUrl({
    userId: 'user-123',
    businessId: 'business-456',
  });
  assert.match(url, /^https:\/\/facebook\.test/);
  assert.deepEqual(service.verifyState(state), { userId: 'user-123', businessId: 'business-456' });
  assert.throws(() => service.verifyState(`${state}tampered`));
});

test('Meta OAuth callback encrypts the token before repository persistence', async () => {
  process.env.AUTH_JWT_SECRET = 'unit-test-secret-with-at-least-32-characters';
  let persisted;
  const provider = {
    createAuthorizationUrl: () => 'https://facebook.test/oauth',
    exchangeCode: async () => ({ accessToken: 'plain-access-token', tokenType: 'bearer', expiresIn: 3600 }),
    scopes: () => ['pages_show_list'],
  };
  const service = new MetaConnectionService({
    provider,
    repository: { save: async (value) => { persisted = value; return { Status: 'Connected' }; } },
    encryptor: { encrypt: (value) => `encrypted:${value}` },
  });
  const { state } = service.authorizationUrl({ userId: 'user-123', businessId: 'business-456' });
  const result = await service.completeAuthorization({ code: 'one-time-code', state });
  assert.equal(persisted.encryptedAccessToken, 'encrypted:plain-access-token');
  assert.equal(persisted.businessId, 'business-456');
  assert.equal(result.businessId, 'business-456');
});
