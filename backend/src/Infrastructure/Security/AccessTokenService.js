import { createHmac } from 'node:crypto';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

export class AccessTokenService {
  lifetimeSeconds() {
    const minutes = Number(process.env.AUTH_ACCESS_TOKEN_MINUTES || 15);
    if (!Number.isInteger(minutes) || minutes < 10 || minutes > 15) throw new Error('AUTH_ACCESS_TOKEN_MINUTES must be between 10 and 15');
    return minutes * 60;
  }
  issue(userId, authVersion = 0, sessionId) {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT signing is not configured');
    const now = Math.floor(Date.now() / 1000);
    const head = encode({ alg: 'HS256', typ: 'JWT' });
    if (!sessionId) throw new Error('Session id is required to issue an access token');
    const payload = encode({ sub: userId, sid: sessionId, ver: authVersion, iat: now, exp: now + this.lifetimeSeconds() });
    const signature = createHmac('sha256', secret).update(`${head}.${payload}`).digest('base64url');
    return `${head}.${payload}.${signature}`;
  }
}
