import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

function signingSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_JWT_SECRET_NOT_CONFIGURED');
  return secret;
}

function sign(value) {
  return createHmac('sha256', signingSecret()).update(value).digest('base64url');
}

export class MetaConnectionService {
  constructor({ provider, repository, encryptor }) {
    this.provider = provider;
    this.repository = repository;
    this.encryptor = encryptor;
  }

  createState({ userId, businessId }) {
    const payload = Buffer.from(JSON.stringify({
      userId, businessId, nonce: randomBytes(32).toString('base64url'),
      expiresAt: Date.now() + STATE_TTL_MS,
    })).toString('base64url');
    return `${payload}.${sign(payload)}`;
  }

  verifyState(state) {
    if (typeof state !== 'string' || state.length > 2048) throw new Error('META_OAUTH_STATE_INVALID');
    const [payload, signature] = state.split('.');
    if (!payload || !signature) throw new Error('META_OAUTH_STATE_INVALID');
    const expected = Buffer.from(sign(payload));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error('META_OAUTH_STATE_INVALID');
    let data;
    try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }
    catch { throw new Error('META_OAUTH_STATE_INVALID'); }
    if (!data.userId || !data.businessId || !data.nonce || !Number.isFinite(data.expiresAt) || data.expiresAt < Date.now()) {
      throw new Error('META_OAUTH_STATE_EXPIRED');
    }
    return { userId: data.userId, businessId: data.businessId };
  }

  authorizationUrl({ userId, businessId }) {
    const state = this.createState({ userId, businessId });
    return { state, url: this.provider.createAuthorizationUrl({ state }) };
  }

  async completeAuthorization({ code, state }) {
    const { userId, businessId } = this.verifyState(state);
    const token = await this.provider.exchangeCode(code);
    if (!token.accessToken || !Number.isFinite(token.expiresIn) || token.expiresIn <= 0) {
      throw new Error('META_TOKEN_RESPONSE_INVALID');
    }
    const expiresAt = new Date(Date.now() + token.expiresIn * 1000).toISOString();
    const encryptedAccessToken = this.encryptor.encrypt(token.accessToken);
    const connection = await this.repository.save({
      businessId,
      userId,
      encryptedAccessToken,
      tokenType: token.tokenType,
      scopes: this.provider.scopes(),
      expiresAt,
    });
    return { connection, businessId };
  }
}
