import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function encryptionKey() {
  const configured = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!configured) throw new Error('META_TOKEN_ENCRYPTION_KEY_NOT_CONFIGURED');
  const decoded = Buffer.from(configured, 'base64');
  const key = decoded.length === 32 ? decoded : Buffer.from(configured, 'utf8');
  if (key.length !== 32) throw new Error('META_TOKEN_ENCRYPTION_KEY_MUST_BE_32_BYTES');
  return key;
}

export class MetaTokenEncryptor {
  encrypt(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return JSON.stringify({
      version: 1,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    });
  }

  decrypt(envelopeText) {
    const envelope = JSON.parse(envelopeText);
    if (envelope.version !== 1 || envelope.algorithm !== 'aes-256-gcm') throw new Error('META_TOKEN_ENVELOPE_UNSUPPORTED');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
