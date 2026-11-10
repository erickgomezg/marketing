import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresWhatsAppRepository {
  async getConfiguration() {
    const result = await executeFunction('usp_whatsapp_configuration_get');
    return result.recordset[0] || null;
  }
  async saveConfiguration({ groupId, groupName, userId }) {
    const result = await executeFunction('usp_whatsapp_configuration_save', [groupId, groupName, userId]);
    return result.recordset[0] || null;
  }
}
