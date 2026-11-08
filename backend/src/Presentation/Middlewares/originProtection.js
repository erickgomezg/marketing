const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function configuredOrigins() {
  const values = [process.env.APP_PUBLIC_URL || 'http://localhost', ...(process.env.APP_ALLOWED_ORIGINS || '').split(',')];
  return new Set(values.map((value) => value.trim()).filter(Boolean).map((value) => {
    try { return new URL(value).origin; } catch { throw new Error('APP_PUBLIC_URL and APP_ALLOWED_ORIGINS must contain valid absolute URLs'); }
  }));
}

export function createOriginProtection({ allowedOrigins = configuredOrigins() } = {}) {
  return function originProtection(request, response, next) {
    if (SAFE_METHODS.has(request.method)) return next();
    // Reject cross-origin browser mutations even on public endpoints such as login.
    // Cookie-authenticated mutations must also carry an explicit allowed Origin.
    const origin = request.get('origin');
    if ((origin && !allowedOrigins.has(origin)) || (request.cookies?.amm_access && !origin)) {
      return response.status(403).json({ error: 'Origen de solicitud no permitido.' });
    }
    return next();
  };
}
