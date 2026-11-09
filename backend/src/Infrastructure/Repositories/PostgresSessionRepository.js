import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresSessionRepository {
  execute(action, values = {}) {
    return executeFunction('usp_auth_session', [
      action, values.userId || null, values.sessionId || null,
      values.tokenHash || null, values.newTokenHash || null, values.expiresAt || null,
    ]);
  }
}
