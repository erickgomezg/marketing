import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresAccessRepository {
  async listUsers(actorUserId) {
    return (await executeFunction('usp_user_listforadmin', [actorUserId])).recordset;
  }
  async setUserActive(actorUserId, targetUserId, isActive) {
    await executeFunction('usp_user_setactive', [actorUserId, targetUserId, isActive]);
  }
  async listBusinesses(userId) {
    return (await executeFunction('usp_business_listauthorized', [userId])).recordset;
  }
  async listSocialAccounts(userId, businessId, socialPlatformId) {
    return (await executeFunction('usp_socialaccount_listauthorized', [userId, businessId || null, socialPlatformId ?? null])).recordset;
  }
  async listPermissions(actorUserId, targetUserId) {
    return (await executeFunction('usp_permission_listforadmin', [actorUserId, targetUserId])).recordset;
  }
  async savePermissions(actorUserId, targetUserId, assignments) {
    await executeFunction('usp_permission_saveforviewer', [actorUserId, targetUserId, JSON.stringify(assignments)]);
  }
}
