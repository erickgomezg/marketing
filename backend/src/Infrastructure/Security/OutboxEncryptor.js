import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function key() {
  const configured = process.env.EMAIL_ENCRYPTION_KEY;
  if (!configured) throw new Error('EMAIL_ENCRYPTION_KEY is not configured');
  const decoded = Buffer.from(configured, 'base64');
  const value = decoded.length === 32 ? decoded : Buffer.from(configured, 'utf8');
  if (value.length !== 32) throw new Error('EMAIL_ENCRYPTION_KEY must be a 32-byte value (base64 or raw)');
  return value;
}

export class OutboxEncryptor {
  encrypt(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') });
  }
  decrypt(payload) {
    const envelope = JSON.parse(payload);
    if (envelope.v !== 1) throw new Error('Unsupported encrypted outbox payload');
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }
}
