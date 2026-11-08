export function createRateLimiter({ windowMs, max, message = 'Demasiadas solicitudes. Intenta nuevamente más tarde.' }) {
  if (!Number.isSafeInteger(windowMs) || windowMs < 1000 || !Number.isSafeInteger(max) || max < 1) {
    throw new TypeError('Rate limiter requires a positive integer windowMs and max');
  }
  const buckets = new Map();

  return function rateLimiter(request, response, next) {
    const now = Date.now();
    const key = request.ip || request.socket?.remoteAddress || 'unknown';
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    // Bound memory usage if many distinct client addresses reach this process.
    if (buckets.size > 10000) {
      for (const [client, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(client);
      }
      if (buckets.size > 10000) buckets.delete(buckets.keys().next().value);
    }

    bucket.count += 1;
    response.set('RateLimit-Limit', String(max));
    response.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    response.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return response.status(429).json({ error: message });
    }
    return next();
  };
}
