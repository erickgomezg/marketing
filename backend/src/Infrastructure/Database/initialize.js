import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getPool } from './Connection/postgres.js';

const appUser = process.env.APP_DB_USER || 'app_user';
const appPassword = process.env.APP_DB_PASSWORD;
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(appUser) || !appPassword) {
  throw new Error('APP_DB_USER and APP_DB_PASSWORD are required for application-role provisioning');
}

const pool = await getPool();
try {
  const role = await pool.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser]);
  const roleSql = await pool.query(
    'SELECT format($1, $2, $3) AS statement',
    [role.rowCount ? 'ALTER ROLE %I WITH LOGIN PASSWORD %L' : 'CREATE ROLE %I WITH LOGIN PASSWORD %L', appUser, appPassword],
  );
  await pool.query(roleSql.rows[0].statement);

  const schemaPath = fileURLToPath(new URL('./StoredProcedures/postgresql-phase-2.sql', import.meta.url));
  await pool.query(await readFile(schemaPath, 'utf8'));

  const grantStatements = [
    'GRANT USAGE ON SCHEMA public TO %I',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
    'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I',
  ];
  for (const template of grantStatements) {
    const result = await pool.query('SELECT format($1, $2) AS statement', [template, appUser]);
    await pool.query(result.rows[0].statement);
  }
  console.log(JSON.stringify({ level: 'info', event: 'postgres_schema_applied', applicationRole: appUser }));
} finally {
  await pool.end();
}
