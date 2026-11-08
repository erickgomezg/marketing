import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const database = process.env.SQLSERVER_DATABASE || 'AI_MARKETING_MANAGER';
const appUser = process.env.SQLSERVER_USER || 'app_user';
const appPassword = process.env.SQLSERVER_PASSWORD;
const adminPassword = process.env.SQLSERVER_SA_PASSWORD;
if (!appPassword || !adminPassword) throw new Error('SQLSERVER_PASSWORD and SQLSERVER_SA_PASSWORD are required');

const config = {
  server: process.env.SQLSERVER_HOST || 'sqlserver',
  port: Number(process.env.SQLSERVER_PORT || 1433),
  database: 'master',
  user: 'sa',
  password: adminPassword,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 5000,
  requestTimeout: 10000,
};

let connection;
let lastError;
for (let attempt = 1; attempt <= 30; attempt += 1) {
  connection = new sql.ConnectionPool(config);
  try {
    await connection.connect();
    break;
  } catch (error) {
    lastError = error;
    await connection.close().catch(() => {});
    connection = undefined;
    if (attempt === 30) throw lastError;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

try {
  const safePassword = appPassword.replaceAll("'", "''");
  const databaseIdentifier = database.replaceAll(']', ']]');
  const userIdentifier = appUser.replaceAll(']', ']]');
  await connection.request().query(`IF DB_ID(N'${database}') IS NULL CREATE DATABASE [${databaseIdentifier}];`);
  await connection.request().query(`IF SUSER_ID(N'${appUser}') IS NULL CREATE LOGIN [${userIdentifier}] WITH PASSWORD = N'${safePassword}', CHECK_POLICY = ON;`);
  console.log(JSON.stringify({ level: 'info', event: 'database_initialized', database }));
} finally {
  await connection.close();
}

const databaseConnection = new sql.ConnectionPool({ ...config, database });
try {
  await databaseConnection.connect();
  const userIdentifier = appUser.replaceAll(']', ']]');
  await databaseConnection.request().query(`IF USER_ID(N'${appUser}') IS NULL CREATE USER [${userIdentifier}] FOR LOGIN [${userIdentifier}];`);
  const schema = await readFile(fileURLToPath(new URL('./StoredProcedures/phase-2.sql', import.meta.url)), 'utf8');
  for (const batch of schema.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean)) {
    await databaseConnection.request().batch(batch);
  }
  // Remove the legacy schema-wide grant before applying least-privilege permissions.
  await databaseConnection.request().query(`REVOKE EXECUTE ON SCHEMA::dbo FROM [${userIdentifier}];`);
  await databaseConnection.request().query(`DENY EXECUTE ON OBJECT::dbo.usp_Auth_BootstrapAdministrator TO [${userIdentifier}];`);

  // Only procedures invoked by the API are executable by app_user.
  // Bootstrap remains exclusive to the isolated initialization service using sa.
  const executableProcedures = [
    'usp_Auth_GetActiveUser', 'usp_Auth_FindByEmail', 'usp_Auth_GoogleUser',
    'usp_User_ListForAdmin', 'usp_User_SetActive', 'usp_Business_ListAuthorized',
    'usp_Permission_ListForAdmin', 'usp_Permission_SaveForViewer',
    'usp_SocialAccount_ListAuthorized', 'usp_SocialData_AuthorizationPredicate',
    'usp_User', 'usp_Invitation', 'usp_PasswordReset', 'usp_EmailOutbox',
  ];
  for (const procedure of executableProcedures) {
    await databaseConnection.request().query(`GRANT EXECUTE ON OBJECT::dbo.[${procedure}] TO [${userIdentifier}];`);
  }
  console.log(JSON.stringify({ level: 'info', event: 'phase_2_schema_applied' }));
} finally {
  await databaseConnection.close();
}
