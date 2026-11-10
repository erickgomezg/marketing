import pg from 'pg';

const { Pool } = pg;
let pool;

function configuration() {
  return {
    host: process.env.PGHOST || process.env.POSTGRES_HOST || 'postgres',
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'ai_marketing_manager',
    user: process.env.PGUSER || process.env.POSTGRES_USER || 'app_user',
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
    max: Number(process.env.PG_POOL_MAX || 4),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    query_timeout: 10000,
    application_name: 'ai-marketing-manager-api',
  };
}

export async function getPool() {
  if (!pool) {
    pool = new Pool(configuration());
    pool.on('error', (error) => {
      console.error(JSON.stringify({ level: 'error', event: 'postgres_pool_error', code: error.code || 'PG_POOL_ERROR' }));
    });
  }
  return pool;
}

export async function executeFunction(name, values = []) {
  if (!/^usp_[a-z0-9_]+$/.test(name)) throw new TypeError('Invalid database function name');
  const connection = await getPool();
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const result = await connection.query(`SELECT * FROM public.${name}(${placeholders})`, values);
  const recordset = result.rows.map((row) => row[Object.keys(row)[0]]);
  return { recordset, rows: result.rows, rowsAffected: [recordset.length] };
}

export function createPostgresAdapter() {
  return {
    async check() {
      const connection = await getPool();
      await connection.query('SELECT 1');
    },
    async close() {
      if (pool) {
        const current = pool;
        pool = undefined;
        await current.end();
      }
    },
  };
}
