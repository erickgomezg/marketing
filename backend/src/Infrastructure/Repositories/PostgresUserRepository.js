import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresUserRepository {
  manage(action, values = {}) {
    return executeFunction('usp_user', [
      action, values.actorUserId || null, values.targetUserId || null,
      values.email || null, values.displayName || null, values.role || null,
      values.isActive ?? null, values.assignments == null ? null : JSON.stringify(values.assignments),
      values.tokenHash || null, values.expiresAt || null, values.payloadEncrypted || null,
    ]);
  }
  invitation(action, values = {}) {
    return executeFunction('usp_invitation', [
      action, values.actorUserId || null, values.targetUserId || null,
      values.tokenHash || null, values.expiresAt || null, values.payloadEncrypted || null,
      values.passwordHash || null,
    ]);
  }
  passwordReset(action, values = {}) {
    return executeFunction('usp_passwordreset', [
      action, values.email || null, values.tokenHash || null, values.expiresAt || null,
      values.payloadEncrypted || null, values.passwordHash || null,
    ]);
  }
  outbox(action, values = {}) {
    return executeFunction('usp_emailoutbox', [
      action, values.outboxId || null, values.sent ?? null, values.errorCode || null,
    ]);
  }
}
