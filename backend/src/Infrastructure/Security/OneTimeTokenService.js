import { createHash, randomBytes } from 'node:crypto';

export class OneTimeTokenService {
  create() {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest();
    return { token, tokenHash };
  }
  hash(token) {
    if (typeof token !== 'string' || token.length < 32 || token.length > 256) return null;
    return createHash('sha256').update(token).digest();
  }
}
