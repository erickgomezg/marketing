import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresAuthRepository {
  async findByEmail(email) {
    const result = await executeFunction('usp_auth_findbyemail', [email]);
    return result.recordset[0] || null;
  }
  async findActiveById(userId, sessionId) {
    const result = await executeFunction('usp_auth_getactiveuser', [userId, sessionId]);
    return result.recordset[0] || null;
  }
  async findActiveByGoogleSubject(subject) {
    const result = await executeFunction('usp_auth_googleuser', [subject]);
    return result.recordset[0] || null;
  }
}
