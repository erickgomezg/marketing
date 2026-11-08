import { OAuth2Client } from 'google-auth-library';

export class GoogleOAuthProvider {
  client() {
    const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REDIRECT_URI: redirectUri } = process.env;
    if (!clientId || !clientSecret || !redirectUri) throw new Error('Google OAuth is not configured');
    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  async createAuthorizationUrl({ state, nonce }) {
    const client = this.client();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    return {
      codeVerifier,
      url: client.generateAuthUrl({ access_type: 'online', response_type: 'code', scope: ['openid', 'email', 'profile'], state, nonce, code_challenge: codeChallenge, code_challenge_method: 'S256' }),
    };
  }

  async verifyAuthorizationCode({ code, codeVerifier, nonce }) {
    const client = this.client();
    const { tokens } = await client.getToken({ code, codeVerifier });
    if (!tokens.id_token) throw new Error('Google identity token is missing');
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const claims = ticket.getPayload();
    if (!claims?.sub || !claims.email || claims.email_verified !== true || claims.nonce !== nonce) throw new Error('Google identity is invalid');
    return claims;
  }
}
