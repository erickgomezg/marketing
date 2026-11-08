import sql from 'mssql';

let pool;

function config() {
  return {
    server: process.env.SQLSERVER_HOST || 'sqlserver',
    port: Number(process.env.SQLSERVER_PORT || 1433),
    database: process.env.SQLSERVER_DATABASE || 'AI_MARKETING_MANAGER',
    user: process.env.SQLSERVER_USER || 'app_user',
    password: process.env.SQLSERVER_PASSWORD,
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT !== 'false',
      trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE !== 'false',
      enableArithAbort: true,
    },
    connectionTimeout: 5000,
    requestTimeout: 5000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  };
}

export async function getPool() {
  if (!pool) pool = sql.connect(config()).catch((error) => { pool = undefined; throw error; });
  return pool;
}

export function createSqlServerAdapter() {
  return {
    async check() {
      const connection = await getPool();
      // A constant sentinel query checks live transport only; business data access remains SP-only.
      await connection.request().query('SELECT 1 AS health');
    },
    async close() {
      if (pool) {
        const connection = await pool.catch(() => undefined);
        pool = undefined;
        await connection?.close();
      }
    },
  };
}
