import { createHash, randomBytes, randomUUID } from 'node:crypto';

const hashToken = (token) => createHash('sha256').update(token).digest();
const lifetimeDays = () => {
  const days = Number(process.env.AUTH_REFRESH_TOKEN_DAYS || 7);
  if (!Number.isInteger(days) || days < 1 || days > 30) throw new Error('AUTH_REFRESH_TOKEN_DAYS must be between 1 and 30');
  return days;
};

export class SessionService {
  constructor({ sessionRepository, tokenService }) { this.sessionRepository = sessionRepository; this.tokenService = tokenService; }

  async create(user) {
    const sessionId = randomUUID();
    const refreshToken = randomBytes(32).toString('base64url');
    const days = lifetimeDays();
    await this.sessionRepository.execute('create', {
      userId: user.UserId || user.userId, sessionId, tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + days * 86400000),
    });
    return {
      sessionId, refreshToken,
      accessToken: this.tokenService.issue(user.UserId || user.userId, user.AuthVersion || 0, sessionId),
      accessExpiresInSeconds: this.tokenService.lifetimeSeconds(), refreshExpiresInSeconds: days * 86400,
    };
  }

  async rotate(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length < 32 || refreshToken.length > 256)
      throw Object.assign(new Error('Invalid refresh token'), { code: 'INVALID_REFRESH_TOKEN' });
    const nextRefreshToken = randomBytes(32).toString('base64url');
    const days = lifetimeDays();
    const result = await this.sessionRepository.execute('rotate', {
      tokenHash: hashToken(refreshToken), newTokenHash: hashToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + days * 86400000),
    });
    const user = result.recordset?.[0];
    if (!user || user.ErrorCode || !user.UserId) throw Object.assign(new Error('Invalid refresh token'), { code: 'INVALID_REFRESH_TOKEN' });
    return {
      refreshToken: nextRefreshToken, accessToken: this.tokenService.issue(user.UserId, user.AuthVersion || 0, user.SessionId),
      accessExpiresInSeconds: this.tokenService.lifetimeSeconds(), refreshExpiresInSeconds: days * 86400,
      user: { userId: user.UserId, email: user.Email, displayName: user.DisplayName, role: user.Role },
    };
  }

  async revoke(refreshToken) {
    if (typeof refreshToken !== 'string' || refreshToken.length < 32 || refreshToken.length > 256) return;
    await this.sessionRepository.execute('revoke', { tokenHash: hashToken(refreshToken) });
  }

  async revokeAll(userId) {
    if (typeof userId !== 'string' || !userId) throw new TypeError('A verified user id is required');
    await this.sessionRepository.execute('revoke_all', { userId });
  }
}
