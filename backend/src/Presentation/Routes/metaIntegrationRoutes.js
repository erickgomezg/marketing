import { Router } from 'express';

const COOKIE_NAME = 'meta_oauth_state';
const CALLBACK_PATH = '/callback';

export function createMetaIntegrationRoutes({ service, authenticate }) {
  const router = Router();

  router.get('/connect', authenticate, (request, response, next) => {
    try {
      const businessId = request.query.businessId;
      if (typeof businessId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) {
        return response.status(400).json({ error: 'businessId inválido.' });
      }
      const { state, url } = service.authorizationUrl({ userId: request.auth.UserId, businessId });
      response.cookie(COOKIE_NAME, state, {
        httpOnly: true, secure: request.secure, sameSite: 'lax',
        path: '/integrations/meta/callback', maxAge: 10 * 60 * 1000,
      });
      return response.redirect(url);
    } catch (error) { return next(error); }
  });

  router.get(CALLBACK_PATH, async (request, response) => {
    const stateCookie = request.cookies?.[COOKIE_NAME];
    response.clearCookie(COOKIE_NAME, {
      httpOnly: true, secure: request.secure, sameSite: 'lax',
      path: '/integrations/meta/callback',
    });
    if (request.query.error || typeof request.query.code !== 'string' || typeof request.query.state !== 'string' || !stateCookie) {
      return response.redirect('/settings/connections?meta=authorization_failed');
    }
    try {
      if (stateCookie !== request.query.state) throw new Error('META_OAUTH_STATE_MISMATCH');
      const { businessId } = await service.completeAuthorization({ code: request.query.code, state: request.query.state });
      return response.redirect(`/settings/connections?meta=connected&businessId=${encodeURIComponent(businessId)}`);
    } catch (error) {
      const code = error.message === 'META_OAUTH_STATE_EXPIRED' ? 'state_expired' : 'connection_failed';
      console.error(JSON.stringify({ level: 'warn', event: 'meta_oauth_callback_failed', code }));
      return response.redirect(`/settings/connections?meta=${code}`);
    }
  });

  return router;
}
