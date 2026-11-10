import test from 'node:test';
import assert from 'node:assert/strict';
import { MetaTokenEncryptor } from '../src/Infrastructure/Security/MetaTokenEncryptor.js';

test('Meta token encryption round-trips without storing plaintext', () => {
  process.env.META_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  const encryptor = new MetaTokenEncryptor();
  const token = 'test-meta-access-token-do-not-use';
  const encrypted = encryptor.encrypt(token);
  assert.equal(encrypted.includes(token), false);
  assert.equal(encryptor.decrypt(encrypted), token);
});

test('Meta token encryption rejects tampered payloads', () => {
  process.env.META_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
  const encryptor = new MetaTokenEncryptor();
  const envelope = JSON.parse(encryptor.encrypt('sensitive-token'));
  envelope.data = Buffer.from('tampered').toString('base64');
  assert.throws(() => encryptor.decrypt(JSON.stringify(envelope)));
});
