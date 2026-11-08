import sql from 'mssql';
import { Argon2PasswordHasher } from '../Security/Argon2PasswordHasher.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
const adminPassword = process.env.SQLSERVER_SA_PASSWORD;

if (!email || !password || !displayName) {
  throw new Error('Bootstrap requires BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, and BOOTSTRAP_ADMIN_NAME');
}
if (!adminPassword) throw new Error('Bootstrap requires SQLSERVER_SA_PASSWORD for the isolated initialization service');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || displayName.length < 2) {
  throw new Error('Bootstrap configuration is invalid; use a valid email, a password of at least 12 characters, and a name');
}

let pool;
try {
  const passwordHash = await new Argon2PasswordHasher().hash(password);
  pool = new sql.ConnectionPool({
    server: process.env.SQLSERVER_HOST || 'sqlserver',
    port: Number(process.env.SQLSERVER_PORT || 1433),
    database: process.env.SQLSERVER_DATABASE || 'AI_MARKETING_MANAGER',
    user: 'sa', password: adminPassword,
    options: { encrypt: process.env.SQLSERVER_ENCRYPT !== 'false', trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE !== 'false' },
    connectionTimeout: 5000, requestTimeout: 10000,
  });
  await pool.connect();
  const result = await pool.request()
    .input('Email', sql.NVarChar(320), email)
    .input('DisplayName', sql.NVarChar(200), displayName)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .execute('dbo.usp_Auth_BootstrapAdministrator');
  console.log(JSON.stringify({ level: 'info', event: result.recordset[0]?.Created ? 'bootstrap_admin_created' : 'bootstrap_admin_already_exists' }));
} catch (error) {
  console.error(JSON.stringify({ level: 'error', event: 'bootstrap_admin_failed', code: error.number || 'BOOTSTRAP_FAILED' }));
  process.exitCode = 1;
} finally {
  await pool?.close().catch(() => {});
}
