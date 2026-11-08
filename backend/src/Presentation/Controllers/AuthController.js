export function createAuthController({ loginWithPassword, userAdministration }) {
  return {
    async login(request, response, next) {
      try {
        const result = await loginWithPassword.execute({ email: request.body?.email, password: request.body?.password });
        const secure = process.env.NODE_ENV === 'production';
        response.cookie('amm_access', result.accessToken, {
          httpOnly: true, secure, sameSite: 'lax', path: '/',
          maxAge: result.expiresInSeconds * 1000,
        });
        response.status(200).json({ user: result.user });
      } catch (error) {
        if (error.code === 'INVALID_CREDENTIALS') return response.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        return next(error);
      }
    },
    logout(_request, response) {
      response.clearCookie('amm_access', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
      response.status(204).end();
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
        response.clearCookie('amm_access', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
        response.status(204).end();
      } catch (error) {
        if (error.code === 'INVALID_RESET' || error.number === 51020) return response.status(400).json({ error: 'El enlace de recuperación no es válido o expiró.' });
        next(error);
      }
    },
  };
}
