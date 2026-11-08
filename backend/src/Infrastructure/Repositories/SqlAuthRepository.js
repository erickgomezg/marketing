import sql from 'mssql';
import { getPool } from '../Database/Connection/sqlServer.js';

export class SqlAuthRepository {
  async findByEmail(email) {
    const pool = await getPool();
    const result = await pool.request().input('Email', sql.NVarChar(320), email).execute('dbo.usp_Auth_FindByEmail');
    return result.recordset[0] || null;
  }

  async findActiveById(userId, sessionId) {
    const pool = await getPool();
    const result = await pool.request().input('UserId', sql.UniqueIdentifier, userId)
      .input('SessionId', sql.UniqueIdentifier, sessionId).execute('dbo.usp_Auth_GetActiveUser');
    return result.recordset[0] || null;
  }

  async findActiveByGoogleSubject(subject) {
    const pool = await getPool();
    const result = await pool.request().input('GoogleSubject', sql.NVarChar(255), subject).execute('dbo.usp_Auth_GoogleUser');
    return result.recordset[0] || null;
  }
}
