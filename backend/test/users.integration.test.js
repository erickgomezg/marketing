import test from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { randomUUID } from 'node:crypto';
import { SqlUserRepository } from '../src/Infrastructure/Repositories/SqlUserRepository.js';
import { UserAdministrationService } from '../src/Application/Services/UserAdministrationService.js';
import { OneTimeTokenService } from '../src/Infrastructure/Security/OneTimeTokenService.js';
import { OutboxEncryptor } from '../src/Infrastructure/Security/OutboxEncryptor.js';
import { Argon2PasswordHasher } from '../src/Infrastructure/Security/Argon2PasswordHasher.js';
import { createSqlServerAdapter } from '../src/Infrastructure/Database/Connection/sqlServer.js';

const enabled = process.env.RUN_SQL_INTEGRATION === 'true';
const config = {
  server: process.env.SQLSERVER_HOST || '127.0.0.1', port: Number(process.env.SQLSERVER_PORT || 1433),
  database: process.env.SQLSERVER_DATABASE || 'AI_MARKETING_MANAGER', user: 'sa',
  password: process.env.SQLSERVER_SA_PASSWORD, options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 10000, requestTimeout: 15000,
};

test('Fase 2: usuarios, permisos, invitaciones, recuperación, auditoría y Outbox en SQL efímero', { skip: !enabled }, async (t) => {
  const pool = await new sql.ConnectionPool(config).connect();
  const userRepository = new SqlUserRepository();
  const tokenService = new OneTimeTokenService();
  const encryptor = new OutboxEncryptor();
  const hasher = new Argon2PasswordHasher();
  const dispatcher = { dispatchPending: async () => { throw new Error('synthetic smtp failure'); } };
  const service = new UserAdministrationService({ userRepository, tokenService, passwordHasher: hasher, encryptor, outboxDispatcher: dispatcher });
  const emailSuffix = randomUUID();
  let adminEmail;
  const fixtureBusinessId = randomUUID();
  let adminId;
  let viewerId;
  let platformIds;
  process.env.NODE_ENV = 'development';
  process.env.DEV_RETURN_ACTION_LINKS = 'true';
  process.env.APP_PUBLIC_URL = 'http://localhost';
  process.env.EMAIL_ENCRYPTION_KEY ||= Buffer.alloc(32, 19).toString('base64');

  try {
    const existingAdmin = await pool.request().query("SELECT TOP(1) Email FROM dbo.AppUser WHERE Role='Administrador' AND IsActive=1 ORDER BY CreatedAt");
    adminEmail = existingAdmin.recordset[0]?.Email || `admin-${emailSuffix}@example.invalid`;
    if (existingAdmin.recordset.length === 0) {
      const adminPasswordHash = await hasher.hash('Synthetic-Admin-Password-2026');
      await pool.request().input('Email', sql.NVarChar(320), adminEmail).input('DisplayName', sql.NVarChar(200), 'Synthetic Admin')
        .input('PasswordHash', sql.NVarChar(255), adminPasswordHash).execute('dbo.usp_Auth_BootstrapAdministrator');
    }
    const admin = await pool.request().input('Email', sql.NVarChar(320), adminEmail).execute('dbo.usp_Auth_FindByEmail');
    adminId = admin.recordset[0].UserId;
    await pool.request().input('BusinessId', sql.UniqueIdentifier, fixtureBusinessId).input('Name', sql.NVarChar(200), `Synthetic ${emailSuffix}`)
      .query("INSERT dbo.Business(BusinessId,Name,Status) VALUES(@BusinessId,@Name,'Active')");
    platformIds = (await pool.request().query('SELECT SocialPlatformId FROM dbo.SocialPlatform WHERE IsActive=1 ORDER BY SocialPlatformId')).recordset.map((row) => row.SocialPlatformId);
    assert.ok(platformIds.length >= 3, 'three active platforms are available');
    const one = [{ businessId: fixtureBusinessId, socialPlatformId: platformIds[0] }];
    const many = platformIds.slice(0, 3).map((socialPlatformId) => ({ businessId: fixtureBusinessId, socialPlatformId }));
    const create = (email, assignments = one, role = 'Viewer') => service.createUser(adminId, { email, displayName: 'Synthetic Viewer', role, assignments });
    const getToken = (result) => new URL(result.actionLink).searchParams.get('token');

    await t.test('01 Viewer con un permiso queda pendiente y persiste usuario/permisos', async () => {
      const result = await create(`one-${emailSuffix}@example.invalid`);
      viewerId = result.user.UserId;
      assert.equal(result.user.IsActive, false);
      const permissions = await pool.request().input('ActorUserId', sql.UniqueIdentifier, adminId).input('TargetUserId', sql.UniqueIdentifier, viewerId).execute('dbo.usp_Permission_ListForAdmin');
      assert.equal(permissions.recordset.filter((row) => row.IsActive).length, 1);
      await service.acceptInvitation(new URL(result.actionLink).searchParams.get('token'), 'Synthetic-Viewer-Password-2026');
    });
    await t.test('02 Viewer con múltiples permisos', async () => {
      const result = await create(`many-${emailSuffix}@example.invalid`, many);
      const rows = await pool.request().input('ActorUserId', sql.UniqueIdentifier, adminId).input('TargetUserId', sql.UniqueIdentifier, result.user.UserId).execute('dbo.usp_Permission_ListForAdmin');
      assert.equal(rows.recordset.filter((row) => row.IsActive).length, 3);
    });
    await t.test('03 Viewer sin permisos rechazado', async () => {
      await assert.rejects(create(`none-${emailSuffix}@example.invalid`, []), (error) => error.code === 'INVALID_ASSIGNMENTS');
    });
    await t.test('04 Correo duplicado normalizado rechazado', async () => {
      await assert.rejects(create(`ONE-${emailSuffix}@EXAMPLE.INVALID`), (error) => error.number === 51016);
    });
    await t.test('05 Un Viewer no puede provisionar usuarios', async () => {
      await assert.rejects(userRepository.manage('create', { actorUserId: viewerId, targetUserId: randomUUID(), email: `denied-${emailSuffix}@example.invalid`, displayName: 'Denied', role: 'Administrador', tokenHash: tokenService.create().tokenHash, expiresAt: new Date(Date.now() + 3600000), payloadEncrypted: encryptor.encrypt({ to: adminEmail, subject: 'x', text: 'x' }) }), (error) => error.number === 51001);
    });
    await t.test('06 Invitación queda asociada, token de hash y Outbox persiste cuando falla correo', async () => {
      const rows = await pool.request().input('UserId', sql.UniqueIdentifier, viewerId).query("SELECT i.TokenHash,o.Status,o.PayloadEncrypted FROM dbo.UserInvitation i JOIN dbo.EmailOutbox o ON o.UserId=i.UserId WHERE i.UserId=@UserId AND o.MessageType='invitation'");
      assert.equal(rows.recordset.length, 1);
      assert.equal(rows.recordset[0].Status, 'Pending');
      assert.equal(rows.recordset[0].TokenHash.length, 32);
      assert.ok(rows.recordset[0].PayloadEncrypted.includes('"data"'));
    });
    await t.test('07 Token de invitación incorrecto rechazado', async () => {
      assert.equal(await service.validateInvitation('x'.repeat(48)), null);
    });
    await t.test('08 Invitación expirada no se valida ni acepta', async () => {
      const fresh = await create(`expired-${emailSuffix}@example.invalid`);
      const token = getToken(fresh);
      const tokenHash = tokenService.hash(token);
      await pool.request().input('TokenHash', sql.VarBinary(32), tokenHash).query('UPDATE dbo.UserInvitation SET ExpiresAt=DATEADD(hour,-1,SYSUTCDATETIME()) WHERE TokenHash=@TokenHash');
      assert.equal(await service.validateInvitation(token), null);
      await assert.rejects(service.acceptInvitation(token, 'Synthetic-Strong-Password-2026'), (error) => error.number === 51019);
    });
    await t.test('09 Invitación válida activa la cuenta y establece hash Argon2id', async () => {
      const fresh = await create(`accept-${emailSuffix}@example.invalid`);
      const token = getToken(fresh);
      assert.equal((await service.validateInvitation(token)).Role, 'Viewer');
      await service.acceptInvitation(token, 'Synthetic-Strong-Password-2026');
      const row = await pool.request().input('UserId', sql.UniqueIdentifier, fresh.user.UserId).query('SELECT IsActive,ActivatedAt,PasswordHash FROM dbo.AppUser WHERE UserId=@UserId');
      assert.equal(row.recordset[0].IsActive, true);
      assert.ok(row.recordset[0].ActivatedAt);
      assert.match(row.recordset[0].PasswordHash, /^\$argon2id\$/);
    });
    await t.test('10 Invitación sólo se acepta una vez', async () => {
      const fresh = await create(`once-${emailSuffix}@example.invalid`);
      const token = getToken(fresh);
      await service.acceptInvitation(token, 'Synthetic-Strong-Password-2026');
      await assert.rejects(service.acceptInvitation(token, 'Another-Strong-Password-2026'), (error) => error.number === 51019);
    });
    await t.test('11 Reenvío invalida token anterior y genera uno nuevo', async () => {
      const fresh = await create(`resend-${emailSuffix}@example.invalid`);
      const oldToken = getToken(fresh);
      const resent = await service.resendInvitation(adminId, fresh.user.UserId);
      assert.equal(await service.validateInvitation(oldToken), null);
      assert.ok(await service.validateInvitation(getToken(resent)));
    });
    await t.test('12 Revocar invitación invalida su token', async () => {
      const fresh = await create(`revoke-${emailSuffix}@example.invalid`);
      const token = getToken(fresh);
      await service.revokeInvitation(adminId, fresh.user.UserId);
      assert.equal(await service.validateInvitation(token), null);
    });
    await t.test('13 Solicitud de recuperación responde igual para correo desconocido y conocido', async () => {
      await service.requestPasswordReset(`unknown-${emailSuffix}@example.invalid`);
      await service.requestPasswordReset(adminEmail);
      const rows = await pool.request().input('Email', sql.NVarChar(320), adminEmail).query("SELECT TOP(1) o.PayloadEncrypted FROM dbo.EmailOutbox o JOIN dbo.AppUser u ON u.UserId=o.UserId WHERE u.Email=@Email AND o.MessageType='password_reset' ORDER BY o.CreatedAt DESC");
      assert.ok(rows.recordset.length);
      const message = encryptor.decrypt(rows.recordset[0].PayloadEncrypted);
      assert.match(message.text, /reset-password\?token=/);
    });
    await t.test('14 Reset de contraseña es de un solo uso y revoca versión de sesión', async () => {
      const outbox = await pool.request().input('Email', sql.NVarChar(320), adminEmail).query("SELECT TOP(1) o.PayloadEncrypted FROM dbo.EmailOutbox o JOIN dbo.AppUser u ON u.UserId=o.UserId WHERE u.Email=@Email AND o.MessageType='password_reset' ORDER BY o.CreatedAt DESC");
      const token = new URL(encryptor.decrypt(outbox.recordset[0].PayloadEncrypted).text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
      const before = await pool.request().input('Email', sql.NVarChar(320), adminEmail).execute('dbo.usp_Auth_FindByEmail');
      await service.resetPassword(token, 'Synthetic-Reset-Password-2026');
      await assert.rejects(service.resetPassword(token, 'Synthetic-Reset-Password-2027'), (error) => error.number === 51020);
      const admin = await pool.request().input('Email', sql.NVarChar(320), adminEmail).execute('dbo.usp_Auth_FindByEmail');
      assert.equal(admin.recordset[0].AuthVersion, before.recordset[0].AuthVersion + 1);
    });
    await t.test('15 Cambio de rol por actor no autorizado rechazado', async () => {
      await assert.rejects(userRepository.manage('role', { actorUserId: viewerId, targetUserId: viewerId, role: 'Administrador', assignments: [] }), (error) => error.number === 51001);
    });
    await t.test('16 Último Administrador protegido de desactivación y degradación', async () => {
      await assert.rejects(pool.request().input('ActorUserId', sql.UniqueIdentifier, adminId).input('TargetUserId', sql.UniqueIdentifier, adminId).input('IsActive', sql.Bit, false).execute('dbo.usp_User_SetActive'), (error) => error.number === 51012);
      await assert.rejects(userRepository.manage('role', { actorUserId: adminId, targetUserId: adminId, role: 'Viewer', assignments: one }), (error) => error.number === 51012);
    });
    await t.test('17 Cambios administrativos dejan auditoría', async () => {
      const result = await create(`audit-${emailSuffix}@example.invalid`);
      const rows = await pool.request().input('UserId', sql.UniqueIdentifier, result.user.UserId).query('SELECT COUNT(*) Total FROM dbo.AuditLog WHERE TargetUserId=@UserId');
      assert.ok(rows.recordset[0].Total >= 1);
    });
    await t.test('18 Asignaciones duplicadas e IDs inválidos rechazados', async () => {
      const duplicate = [one[0], one[0]];
      await assert.rejects(create(`dupe-${emailSuffix}@example.invalid`, duplicate), (error) => error.code === 'INVALID_ASSIGNMENTS');
      await assert.rejects(create(`invalid-${emailSuffix}@example.invalid`, [{ businessId: randomUUID(), socialPlatformId: platformIds[0] }]), (error) => error.number === 51004);
    });
  } finally {
    await pool.close();
    await createSqlServerAdapter().close();
  }
});
