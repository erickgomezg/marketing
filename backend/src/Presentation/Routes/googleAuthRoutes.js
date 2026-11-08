import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';

export function createAuthRoutes({ googleLogin, googleProvider, authController, authenticate }) {
const router = Router();
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh', authController.refresh);
router.post('/invitation/validate', authController.validateInvitation);
router.post('/invitation/accept', authController.acceptInvitation);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
const cookieName = 'google_oauth_state';
const readCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value));
router.get('/google', async (req, res) => {
  try {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const { codeVerifier, url } = await googleProvider.createAuthorizationUrl({ state, nonce });
    res.cookie(cookieName, `${state}.${nonce}.${codeVerifier}`, { httpOnly: true, sameSite: 'lax', secure: req.get('x-forwarded-proto') === 'https', path: '/api/auth/google/callback', maxAge: 5 * 60 * 1000 });
    return res.redirect(url);
  } catch {
    return res.status(503).send('Inicio de sesión con Google no configurado.');
  }
});

router.get('/google/callback', async (req, res) => {
  const cookie = readCookies(req.get('cookie'))[cookieName];
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: req.get('x-forwarded-proto') === 'https', path: '/api/auth/google/callback' });
  try {
    if (req.query.error || typeof req.query.code !== 'string' || typeof req.query.state !== 'string' || !cookie) throw new Error('oauth_denied');
    const [expectedState, nonce, codeVerifier] = cookie.split('.');
    const expected = Buffer.from(expectedState || ''); const received = Buffer.from(req.query.state);
    if (!expected.length || expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error('invalid_state');
    const claims = await googleProvider.verifyAuthorizationCode({ code: req.query.code, codeVerifier, nonce });
    const result = await googleLogin.execute(claims.sub);
    res.cookie('amm_access', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: result.accessExpiresInSeconds * 1000 });
    res.cookie('amm_refresh', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: result.refreshExpiresInSeconds * 1000 });
    return res.redirect('/');
  } catch (error) {
    const code = error.code === 'IDENTITY_NOT_PROVISIONED' ? 'identity_not_provisioned' : 'google_login_failed';
    console.error(JSON.stringify({ level: 'warn', event: 'google_login_failed', code }));
    return res.redirect(`/?auth_error=${code}`);
  }
});
return router;
}
