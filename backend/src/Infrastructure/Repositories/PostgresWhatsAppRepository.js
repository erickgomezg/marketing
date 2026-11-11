import { executeFunction } from '../Database/Connection/postgres.js';

export class PostgresWhatsAppRepository {
  async getConfiguration() {
    const result = await executeFunction('usp_whatsapp_configuration_get');
    return result.rows[0] || null;
  }
  async clearConfiguration() {
    await executeFunction('usp_whatsapp_configuration_save', [null, null, null]);
  }
  async saveConfiguration({ groupId, groupName, userId }) {
    const result = await executeFunction('usp_whatsapp_configuration_save', [groupId, groupName, userId]);
    return result.rows[0] || null;
  }
}
