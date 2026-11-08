import sql from 'mssql';
import { getPool } from '../Database/Connection/sqlServer.js';

export class SqlSessionRepository {
  async execute(action, values = {}) {
    const pool = await getPool();
    return pool.request().input('accion', sql.NVarChar(20), action)
      .input('UserId', sql.UniqueIdentifier, values.userId || null)
      .input('SessionId', sql.UniqueIdentifier, values.sessionId || null)
      .input('TokenHash', sql.VarBinary(32), values.tokenHash || null)
      .input('NewTokenHash', sql.VarBinary(32), values.newTokenHash || null)
      .input('ExpiresAt', sql.DateTime2, values.expiresAt || null)
      .execute('dbo.usp_Auth_Session');
  }
}
