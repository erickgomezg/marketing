import express from 'express';
import { createOriginProtection } from './Presentation/Middlewares/originProtection.js';
import { createRateLimiter } from './Presentation/Middlewares/rateLimiter.js';
import { createPostgresAdapter } from './Infrastructure/Database/Connection/postgres.js';
import { createRedisAdapter } from './Infrastructure/Cache/redis.js';
import { createMinioAdapter } from './Infrastructure/Storage/minio.js';
import { createAuthRoutes } from './Presentation/Routes/googleAuthRoutes.js';
import { createAccessRoutes } from './Presentation/Routes/accessRoutes.js';
import { createMetaIntegrationRoutes } from './Presentation/Routes/metaIntegrationRoutes.js';
import { createAuthenticate, requireAdministrator } from './Presentation/Middlewares/authenticate.js';
import { PostgresAuthRepository } from './Infrastructure/Repositories/PostgresAuthRepository.js';
import { PostgresSessionRepository } from './Infrastructure/Repositories/PostgresSessionRepository.js';
import { SessionService } from './Application/Services/SessionService.js';
import { PostgresAccessRepository } from './Infrastructure/Repositories/PostgresAccessRepository.js';
import { AccessService } from './Application/Services/AccessService.js';
import { LoginWithPassword } from './Application/UseCases/LoginWithPassword.js';
import { LoginWithGoogleIdentity } from './Application/UseCases/LoginWithGoogleIdentity.js';
import { Argon2PasswordHasher } from './Infrastructure/Security/Argon2PasswordHasher.js';
import { AccessTokenService } from './Infrastructure/Security/AccessTokenService.js';
import { GoogleOAuthProvider } from './Infrastructure/Providers/GoogleOAuthProvider.js';
import { MetaOAuthProvider } from './Infrastructure/Providers/MetaOAuthProvider.js';
import { MetaTokenEncryptor } from './Infrastructure/Security/MetaTokenEncryptor.js';
import { PostgresMetaConnectionRepository } from './Infrastructure/Repositories/PostgresMetaConnectionRepository.js';
import { MetaConnectionService } from './Application/Services/MetaConnectionService.js';
import { createAuthController } from './Presentation/Controllers/AuthController.js';
import { PostgresUserRepository } from './Infrastructure/Repositories/PostgresUserRepository.js';
import { OneTimeTokenService } from './Infrastructure/Security/OneTimeTokenService.js';
import { OutboxEncryptor } from './Infrastructure/Security/OutboxEncryptor.js';
import { SmtpEmailProvider } from './Infrastructure/Providers/SmtpEmailProvider.js';
import { EmailOutboxDispatcher } from './Application/Services/EmailOutboxDispatcher.js';
import { UserAdministrationService } from './Application/Services/UserAdministrationService.js';

const app = express();
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));
app.use(express.json({ limit: '256kb' }));
app.use((request, _response, next) => {
  request.cookies = Object.fromEntries((request.headers.cookie || '').split(';').map((entry) => entry.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value));
  next();
});
app.use(createOriginProtection());
app.use('/auth/login', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }));
app.use('/auth/forgot-password', createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }));
app.use('/auth/reset-password', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/auth/refresh', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use('/auth/invitation/validate', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/auth/invitation/accept', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/integrations/meta/connect', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }));
const authRepository = new PostgresAuthRepository();
const tokenService = new AccessTokenService();
const sessionService = new SessionService({ sessionRepository: new PostgresSessionRepository(), tokenService });
const authenticate = createAuthenticate({ authRepository });
const loginWithPassword = new LoginWithPassword({ authRepository, passwordHasher: new Argon2PasswordHasher(), sessionService });
const googleLogin = new LoginWithGoogleIdentity({ authRepository, sessionService });
const userRepository = new PostgresUserRepository();
const passwordHasher = new Argon2PasswordHasher();
const encryptor = new OutboxEncryptor();
const outboxDispatcher = new EmailOutboxDispatcher({ userRepository, encryptor, emailProvider: new SmtpEmailProvider() });
const userAdministration = new UserAdministrationService({ userRepository, tokenService: new OneTimeTokenService(), passwordHasher, encryptor, outboxDispatcher });
const authController = createAuthController({ loginWithPassword, userAdministration, sessionService });
app.use('/auth', createAuthRoutes({ googleLogin, googleProvider: new GoogleOAuthProvider(), authController, authenticate }));
app.use('/access', createAccessRoutes({ accessService: new AccessService({ accessRepository: new PostgresAccessRepository(), userRepository, userAdministration }), authenticate, requireAdministrator }));

const metaConnectionService = new MetaConnectionService({
  provider: new MetaOAuthProvider(),
  repository: new PostgresMetaConnectionRepository(),
  encryptor: new MetaTokenEncryptor(),
});
app.use('/integrations/meta', createMetaIntegrationRoutes({ service: metaConnectionService, authenticate }));

const port = Number(process.env.API_PORT || 3000);
const adapters = { postgres: createPostgresAdapter(), redis: createRedisAdapter(), minio: createMinioAdapter() };
app.get('/health', (_request, response) => response.status(200).json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_request, response) => {
  const results = await Promise.all(Object.entries(adapters).map(async ([name, adapter]) => {
    try { await adapter.check(); return [name, { status: 'available' }]; }
    catch (error) {
      console.error(JSON.stringify({ level: 'error', event: 'dependency_check_failed', dependency: name, code: error.code || 'DEPENDENCY_UNAVAILABLE' }));
      return [name, { status: 'unavailable', message: 'Connection check failed' }];
    }
  }));
  const dependencies = Object.fromEntries(results);
  const ready = Object.values(dependencies).every(({ status }) => status === 'available');
  response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', dependencies, timestamp: new Date().toISOString() });
});
app.use((error, _request, response, _next) => {
  console.error(JSON.stringify({ level: 'error', event: 'request_failed', code: error.code || 'INTERNAL_ERROR' }));
  response.status(error.status || 500).json({ error: error.status === 503 ? 'Autenticación temporalmente no disponible.' : 'No fue posible procesar la solicitud.' });
});
const server = app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ level: 'info', event: 'api_started', port })));
let closing = false;
const outboxTimer = setInterval(() => { outboxDispatcher.dispatchPending().catch((error) => console.error(JSON.stringify({ level: 'warn', event: 'email_outbox_poll_failed', code: error.code || 'OUTBOX_UNAVAILABLE' }))); }, 30000);
outboxTimer.unref();
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  clearInterval(outboxTimer);
  console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
  server.close(async () => { await Promise.allSettled(Object.values(adapters).map((adapter) => adapter.close())); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
