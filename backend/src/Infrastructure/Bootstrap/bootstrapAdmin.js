import { getPool } from '../Database/Connection/postgres.js';
import { Argon2PasswordHasher } from '../Security/Argon2PasswordHasher.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
if (!email || !password || !displayName) throw new Error('Bootstrap requires BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, and BOOTSTRAP_ADMIN_NAME');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || displayName.length < 2) throw new Error('Bootstrap configuration is invalid');
const pool = await getPool();
try {
  const passwordHash = await new Argon2PasswordHasher().hash(password);
  const result = await pool.query('SELECT * FROM public.usp_auth_bootstrapadministrator($1, $2, $3)', [email, displayName, passwordHash]);
  const row = result.rows[0];
  const created = row ? row[Object.keys(row)[0]]?.Created : false;
  console.log(JSON.stringify({ level: 'info', event: created ? 'bootstrap_admin_created' : 'bootstrap_admin_already_exists' }));
} catch (error) {
  console.error(JSON.stringify({ level: 'error', event: 'bootstrap_admin_failed', code: error.code || 'BOOTSTRAP_FAILED' }));
  process.exitCode = 1;
} finally {
  await pool.end();
}
