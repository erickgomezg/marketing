import sql from 'mssql';
import { getPool } from '../Database/Connection/sqlServer.js';

export class SqlUserRepository {
  async manage(action, values = {}) {
    const pool = await getPool();
    const request = pool.request()
      .input('accion', sql.NVarChar(20), action)
      .input('ActorUserId', sql.UniqueIdentifier, values.actorUserId || null)
      .input('TargetUserId', sql.UniqueIdentifier, values.targetUserId || null)
      .input('Email', sql.NVarChar(320), values.email || null)
      .input('DisplayName', sql.NVarChar(200), values.displayName || null)
      .input('Role', sql.NVarChar(20), values.role || null)
      .input('IsActive', sql.Bit, values.isActive ?? null)
      .input('Assignments', sql.NVarChar(sql.MAX), values.assignments == null ? null : JSON.stringify(values.assignments))
      .input('TokenHash', sql.VarBinary(32), values.tokenHash || null)
      .input('ExpiresAt', sql.DateTime2, values.expiresAt || null)
      .input('PayloadEncrypted', sql.NVarChar(sql.MAX), values.payloadEncrypted || null);
    return request.execute('dbo.usp_User');
  }

  async invitation(action, values = {}) {
    const pool = await getPool();
    return pool.request().input('accion', sql.NVarChar(20), action)
      .input('ActorUserId', sql.UniqueIdentifier, values.actorUserId || null)
      .input('TargetUserId', sql.UniqueIdentifier, values.targetUserId || null)
      .input('TokenHash', sql.VarBinary(32), values.tokenHash || null)
      .input('ExpiresAt', sql.DateTime2, values.expiresAt || null)
      .input('PayloadEncrypted', sql.NVarChar(sql.MAX), values.payloadEncrypted || null)
      .input('PasswordHash', sql.NVarChar(255), values.passwordHash || null)
      .execute('dbo.usp_Invitation');
  }

  async passwordReset(action, values = {}) {
    const pool = await getPool();
    return pool.request().input('accion', sql.NVarChar(20), action)
      .input('Email', sql.NVarChar(320), values.email || null)
      .input('TokenHash', sql.VarBinary(32), values.tokenHash || null)
      .input('ExpiresAt', sql.DateTime2, values.expiresAt || null)
      .input('PayloadEncrypted', sql.NVarChar(sql.MAX), values.payloadEncrypted || null)
      .input('PasswordHash', sql.NVarChar(255), values.passwordHash || null)
      .execute('dbo.usp_PasswordReset');
  }

  async outbox(action, values = {}) {
    const pool = await getPool();
    return pool.request().input('accion', sql.NVarChar(20), action)
      .input('OutboxId', sql.UniqueIdentifier, values.outboxId || null)
      .input('Sent', sql.Bit, values.sent ?? null)
      .input('ErrorCode', sql.NVarChar(80), values.errorCode || null)
      .execute('dbo.usp_EmailOutbox');
  }
}
