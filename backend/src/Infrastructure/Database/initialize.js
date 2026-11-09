import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getPool } from './Connection/postgres.js';

const schemaPath = fileURLToPath(new URL('./StoredProcedures/postgresql-phase-2.sql', import.meta.url));
const schema = await readFile(schemaPath, 'utf8');
const pool = await getPool();
try {
  await pool.query(schema);
  console.log(JSON.stringify({ level: 'info', event: 'postgres_schema_applied' }));
} finally {
  await pool.end();
}
