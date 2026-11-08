import sql from 'mssql';
import { getPool } from '../Database/Connection/sqlServer.js';

export class SqlAccessRepository {
  async listUsers(actorUserId) {
    const pool = await getPool();
    return (await pool.request().input('ActorUserId', sql.UniqueIdentifier, actorUserId).execute('dbo.usp_User_ListForAdmin')).recordset;
  }
  async setUserActive(actorUserId, targetUserId, isActive) {
    const pool = await getPool();
    await pool.request().input('ActorUserId', sql.UniqueIdentifier, actorUserId).input('TargetUserId', sql.UniqueIdentifier, targetUserId)
      .input('IsActive', sql.Bit, isActive).execute('dbo.usp_User_SetActive');
  }
  async listBusinesses(userId) {
    const pool = await getPool();
    return (await pool.request().input('UserId', sql.UniqueIdentifier, userId).execute('dbo.usp_Business_ListAuthorized')).recordset;
  }
  async listSocialAccounts(userId, businessId, socialPlatformId) {
    const pool = await getPool();
    const request = pool.request().input('UserId', sql.UniqueIdentifier, userId)
      .input('BusinessId', sql.UniqueIdentifier, businessId)
      .input('SocialPlatformId', sql.Int, socialPlatformId);
    return (await request.execute('dbo.usp_SocialAccount_ListAuthorized')).recordset;
  }
  async listPermissions(actorUserId, targetUserId) {
    const pool = await getPool();
    return (await pool.request().input('ActorUserId', sql.UniqueIdentifier, actorUserId).input('TargetUserId', sql.UniqueIdentifier, targetUserId).execute('dbo.usp_Permission_ListForAdmin')).recordset;
  }
  async savePermissions(actorUserId, targetUserId, assignments) {
    const pool = await getPool();
    await pool.request().input('ActorUserId', sql.UniqueIdentifier, actorUserId).input('TargetUserId', sql.UniqueIdentifier, targetUserId)
      .input('Assignments', sql.NVarChar(sql.MAX), JSON.stringify(assignments)).execute('dbo.usp_Permission_SaveForViewer');
  }
}
