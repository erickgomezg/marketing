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
    // Bearer-token clients do not rely on ambient browser cookies and are not subject to CSRF checks.
    if (!request.cookies?.amm_access) return next();
    const origin = request.get('origin');
    if (!origin || !allowedOrigins.has(origin)) {
      return response.status(403).json({ error: 'Origen de solicitud no permitido.' });
    }
    return next();
  };
}
