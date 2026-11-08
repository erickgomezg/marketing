export function createAuthController({ loginWithPassword, userAdministration, sessionService }) {
  const secure = () => process.env.NODE_ENV === 'production';
  const setCookies = (response, session) => {
    response.cookie('amm_access', session.accessToken, { httpOnly: true, secure: secure(), sameSite: 'lax', path: '/', maxAge: session.accessExpiresInSeconds * 1000 });
    response.cookie('amm_refresh', session.refreshToken, { httpOnly: true, secure: secure(), sameSite: 'lax', path: '/api/auth', maxAge: session.refreshExpiresInSeconds * 1000 });
  };
  const clearCookies = (response) => {
    response.clearCookie('amm_access', { httpOnly: true, secure: secure(), sameSite: 'lax', path: '/' });
    response.clearCookie('amm_refresh', { httpOnly: true, secure: secure(), sameSite: 'lax', path: '/api/auth' });
  };
  return {
    async login(request, response, next) {
      try {
        const result = await loginWithPassword.execute({ email: request.body?.email, password: request.body?.password });
        setCookies(response, result);
        response.status(200).json({ user: result.user });
      } catch (error) {
        if (error.code === 'INVALID_CREDENTIALS') return response.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        return next(error);
      }
    },
    async refresh(request, response, next) {
      try {
        const result = await sessionService.rotate(request.cookies?.amm_refresh);
        setCookies(response, result);
        response.status(200).json({ user: result.user });
      } catch (error) {
        clearCookies(response);
        if (error.code === 'INVALID_REFRESH_TOKEN' || [51032,51033].includes(error.number)) return response.status(401).json({ error: 'La sesión expiró. Inicia sesión nuevamente.' });
        return next(error);
      }
    },
    async logout(request, response, next) {
      try {
        await sessionService.revoke(request.cookies?.amm_refresh);
        clearCookies(response);
        response.status(204).end();
      } catch (error) { next(error); }
    },
    async logoutAll(request, response, next) {
      try {
        await sessionService.revokeAll(request.auth.UserId);
        clearCookies(response);
        response.status(204).end();
      } catch (error) { next(error); }
    },
    async validateInvitation(request, response, next) {
      try {
        const user = await userAdministration.validateInvitation(request.body?.token);
        response.json({ valid: Boolean(user), displayName: user?.DisplayName, email: user?.Email, role: user?.Role });
      } catch (error) { if (error.code === 'INVALID_INVITATION' || [51018, 51019].includes(error.number)) return response.status(400).json({ error: 'La invitación no es válida o expiró.' }); next(error); }
    },
    async acceptInvitation(request, response, next) {
      try {
        await userAdministration.acceptInvitation(request.body?.token, request.body?.password);
        response.status(204).end();
      } catch (error) { if (error.code === 'INVALID_INVITATION' || [51018, 51019].includes(error.number)) return response.status(400).json({ error: 'La invitación no es válida o expiró.' }); next(error); }
    },
    async forgotPassword(request, response, next) {
      try {
        await userAdministration.requestPasswordReset(request.body?.email);
        response.status(202).json({ message: 'Si la cuenta puede recuperar el acceso, recibirá instrucciones por correo.' });
      } catch (error) { next(error); }
    },
    async resetPassword(request, response, next) {
      try {
        await userAdministration.resetPassword(request.body?.token, request.body?.password);
        clearCookies(response);
        response.status(204).end();
      } catch (error) {
        if (error.code === 'INVALID_RESET' || error.number === 51020) return response.status(400).json({ error: 'El enlace de recuperación no es válido o expiró.' });
        next(error);
      }
    },
  };
}
