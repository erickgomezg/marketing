import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresMetaConnectionRepository {
  async save({ businessId, userId, encryptedAccessToken, tokenType, scopes, expiresAt }) {
    const result = await executeFunction('usp_meta_connection_save', [
      businessId, userId, encryptedAccessToken, tokenType, scopes, expiresAt,
    ]);
    return result.recordset[0] || null;
  }

  async findForBusiness({ businessId, userId }) {
    const result = await executeFunction('usp_meta_connection_get', [businessId, userId]);
    return result.recordset[0] || null;
  }
}
