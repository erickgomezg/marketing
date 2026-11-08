const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function configuredOrigins() {
  const values = [process.env.APP_PUBLIC_URL || 'http://localhost', ...(process.env.APP_ALLOWED_ORIGINS || '').split(',')];
  return new Set(values.map((value) => value.trim()).filter(Boolean).map((value) => {
    try { return new URL(value).origin; } catch { throw new Error('APP_PUBLIC_URL and APP_ALLOWED_ORIGINS must contain valid absolute URLs'); }
  }));
}

function requestOrigin(request) {
  try { return new URL(`${request.protocol}://${request.get('host')}`).origin; }
  catch { return null; }
}

export function createOriginProtection({ allowedOrigins = configuredOrigins() } = {}) {
  return function originProtection(request, response, next) {
    if (SAFE_METHODS.has(request.method)) return next();
    // Accept the exact same-origin host even when APP_PUBLIC_URL is not configured
    // for a production domain. Cross-origin mutations remain blocked.
    const origin = request.get('origin');
    const sameOrigin = origin && origin === requestOrigin(request);
    if ((origin && !sameOrigin && !allowedOrigins.has(origin)) || (request.cookies?.amm_access && !origin)) {
      return response.status(403).json({ error: 'Origen de solicitud no permitido.' });
    }
    return next();
  };
}
