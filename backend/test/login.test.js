import test from 'node:test';
import assert from 'node:assert/strict';
import { LoginWithPassword } from '../src/Application/UseCases/LoginWithPassword.js';
import { LoginWithGoogleIdentity } from '../src/Application/UseCases/LoginWithGoogleIdentity.js';
import { Argon2PasswordHasher } from '../src/Infrastructure/Security/Argon2PasswordHasher.js';

const row = { UserId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc08', Email: 'admin@example.test', DisplayName: 'Admin', Role: 'Administrador', IsActive: true, PasswordHash: 'argon-hash', AuthVersion: 0 };
const session = { sessionId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc09', refreshToken: 'opaque-refresh-token', accessToken: 'signed:session', accessExpiresInSeconds: 900, refreshExpiresInSeconds: 604800 };
function useCase({ record = row, verifies = true } = {}) {
  return new LoginWithPassword({
    authRepository: { findByEmail: async () => record },
    passwordHasher: { verify: async () => verifies },
    sessionService: { create: async () => session },
  });
}

test('login with valid password creates a session and returns profile', async () => {
  const result = await useCase().execute({ email: ' ADMIN@example.test ', password: 'correct horse battery staple' });
  assert.equal(result.user.role, 'Administrador');
  assert.equal(result.user.email, 'admin@example.test');
  assert.equal(result.accessToken, session.accessToken);
  assert.equal(result.refreshToken, session.refreshToken);
});

test('login rejects wrong password with a generic error', async () => {
  await assert.rejects(useCase({ verifies: false }).execute({ email: row.Email, password: 'wrong' }), { code: 'INVALID_CREDENTIALS' });
});

test('login rejects inactive and missing accounts with the same error', async () => {
  for (const record of [{ ...row, IsActive: false }, null]) {
    await assert.rejects(useCase({ record }).execute({ email: row.Email, password: 'any' }), { code: 'INVALID_CREDENTIALS' });
  }
});

test('login rejects malformed input before querying credentials', async () => {
  await assert.rejects(useCase().execute({ email: '', password: '' }), { code: 'INVALID_CREDENTIALS' });
});

test('Argon2id hashes verify only the matching password', async () => {
  const hasher = new Argon2PasswordHasher();
  const hash = await hasher.hash('strong test password');
  assert.match(hash, /^\\$argon2id\\$/);
  assert.equal(await hasher.verify(hash, 'strong test password'), true);
  assert.equal(await hasher.verify(hash, 'wrong password'), false);
});

test('Google login refuses unprovisioned identities without creating an account', async () => {
  let created = false;
  const googleLogin = new LoginWithGoogleIdentity({
    authRepository: { findActiveByGoogleSubject: async () => null, createUser: async () => { created = true; } },
    sessionService: { create: async () => session },
  });
  await assert.rejects(googleLogin.execute('unprovisioned-subject'), { code: 'IDENTITY_NOT_PROVISIONED' });
  assert.equal(created, false);
});

test('Google login creates a session only for a linked identity', async () => {
  const googleLogin = new LoginWithGoogleIdentity({
    authRepository: { findActiveByGoogleSubject: async () => row },
    sessionService: { create: async () => session },
  });
  const result = await googleLogin.execute('stable-google-sub');
  assert.equal(result.refreshToken, session.refreshToken);
});
