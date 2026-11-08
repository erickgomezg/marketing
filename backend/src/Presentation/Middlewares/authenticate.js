import { createHmac, timingSafeEqual } from 'node:crypto';

function verifiedSubject(token) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) throw Object.assign(new Error('Authentication is not configured'), { status: 503 });
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest();
  let supplied;
  try { supplied = Buffer.from(parts[2], 'base64url'); } catch { return null; }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (header.alg !== 'HS256' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.sub || '') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.sid || '') || !Number.isInteger(claims.ver) || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    return { userId: claims.sub, sessionId: claims.sid, version: claims.ver };
  } catch { return null; }
}

export function createAuthenticate({ authRepository }) {
return async function authenticate(request, response, next) {
  const token = request.cookies?.amm_access || request.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return response.status(401).json({ error: 'Autenticación requerida' });
  const claims = verifiedSubject(token);
  if (!claims) return response.status(401).json({ error: 'Credencial inválida o vencida' });
  try {
    const user = await authRepository.findActiveById(claims.userId, claims.sessionId);
    if (!user) return response.status(401).json({ error: 'Usuario inactivo o inexistente' });
    if ((user.AuthVersion || 0) !== claims.version) return response.status(401).json({ error: 'La sesión fue revocada' });
    request.auth = user;
    return next();
  } catch (error) { return next(error); }
}
}

export function requireAdministrator(request, response, next) {
  if (request.auth?.Role !== 'Administrador') return response.status(403).json({ error: 'Se requiere rol Administrador' });
  return next();
}
