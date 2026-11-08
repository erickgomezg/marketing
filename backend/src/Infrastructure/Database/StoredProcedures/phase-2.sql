/* Fase 2: permisos internos por comercio y plataforma. Ejecutar de forma idempotente. */
IF OBJECT_ID('dbo.AppUser','U') IS NULL CREATE TABLE dbo.AppUser (
 UserId uniqueidentifier NOT NULL CONSTRAINT PK_AppUser PRIMARY KEY, Email nvarchar(320) NOT NULL CONSTRAINT UQ_AppUser_Email UNIQUE,
 DisplayName nvarchar(200) NOT NULL, Role nvarchar(20) NOT NULL CONSTRAINT CK_AppUser_Role CHECK (Role IN ('Administrador','Viewer')),
 IsActive bit NOT NULL CONSTRAINT DF_AppUser_Active DEFAULT 1, CreatedAt datetime2 NOT NULL CONSTRAINT DF_AppUser_Created DEFAULT SYSUTCDATETIME());
IF COL_LENGTH('dbo.AppUser','PasswordHash') IS NULL ALTER TABLE dbo.AppUser ADD PasswordHash nvarchar(255) NULL;
IF COL_LENGTH('dbo.AppUser','ActivatedAt') IS NULL ALTER TABLE dbo.AppUser ADD ActivatedAt datetime2 NULL;
IF COL_LENGTH('dbo.AppUser','AuthVersion') IS NULL ALTER TABLE dbo.AppUser ADD AuthVersion int NOT NULL CONSTRAINT DF_AppUser_AuthVersion DEFAULT 0;
UPDATE dbo.AppUser SET ActivatedAt=CreatedAt WHERE IsActive=1 AND ActivatedAt IS NULL;
IF OBJECT_ID('dbo.UserInvitation','U') IS NULL CREATE TABLE dbo.UserInvitation (
 InvitationId uniqueidentifier NOT NULL CONSTRAINT PK_UserInvitation PRIMARY KEY,
 UserId uniqueidentifier NOT NULL CONSTRAINT FK_UserInvitation_AppUser REFERENCES dbo.AppUser(UserId),
 TokenHash varbinary(32) NOT NULL CONSTRAINT UQ_UserInvitation_TokenHash UNIQUE,
 ExpiresAt datetime2 NOT NULL, CreatedAt datetime2 NOT NULL CONSTRAINT DF_UserInvitation_Created DEFAULT SYSUTCDATETIME(),
 AcceptedAt datetime2 NULL, RevokedAt datetime2 NULL);
IF OBJECT_ID('dbo.PasswordResetToken','U') IS NULL CREATE TABLE dbo.PasswordResetToken (
 ResetTokenId uniqueidentifier NOT NULL CONSTRAINT PK_PasswordResetToken PRIMARY KEY,
 UserId uniqueidentifier NOT NULL CONSTRAINT FK_PasswordResetToken_AppUser REFERENCES dbo.AppUser(UserId),
 TokenHash varbinary(32) NOT NULL CONSTRAINT UQ_PasswordResetToken_Hash UNIQUE,
 ExpiresAt datetime2 NOT NULL, CreatedAt datetime2 NOT NULL CONSTRAINT DF_PasswordResetToken_Created DEFAULT SYSUTCDATETIME(),
 UsedAt datetime2 NULL, RevokedAt datetime2 NULL);
IF OBJECT_ID('dbo.EmailOutbox','U') IS NULL CREATE TABLE dbo.EmailOutbox (
 OutboxId uniqueidentifier NOT NULL CONSTRAINT PK_EmailOutbox PRIMARY KEY,
 UserId uniqueidentifier NULL CONSTRAINT FK_EmailOutbox_AppUser REFERENCES dbo.AppUser(UserId),
 MessageType nvarchar(40) NOT NULL, PayloadEncrypted nvarchar(max) NOT NULL,
 Status nvarchar(20) NOT NULL CONSTRAINT DF_EmailOutbox_Status DEFAULT 'Pending' CONSTRAINT CK_EmailOutbox_Status CHECK (Status IN ('Pending','Sending','Sent','Failed')),
 AttemptCount int NOT NULL CONSTRAINT DF_EmailOutbox_AttemptCount DEFAULT 0,
 NextAttemptAt datetime2 NOT NULL CONSTRAINT DF_EmailOutbox_NextAttempt DEFAULT SYSUTCDATETIME(),
 LastAttemptAt datetime2 NULL, SentAt datetime2 NULL, CreatedAt datetime2 NOT NULL CONSTRAINT DF_EmailOutbox_Created DEFAULT SYSUTCDATETIME(),
 LastErrorCode nvarchar(80) NULL);
IF OBJECT_ID('dbo.AuditLog','U') IS NULL CREATE TABLE dbo.AuditLog (
 AuditLogId bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
 ActorUserId uniqueidentifier NULL CONSTRAINT FK_AuditLog_Actor REFERENCES dbo.AppUser(UserId),
 TargetUserId uniqueidentifier NULL CONSTRAINT FK_AuditLog_Target REFERENCES dbo.AppUser(UserId),
 Action nvarchar(80) NOT NULL, Details nvarchar(2000) NULL,
 CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuditLog_Created DEFAULT SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.EmailOutbox') AND name='IX_EmailOutbox_Queue') CREATE INDEX IX_EmailOutbox_Queue ON dbo.EmailOutbox(Status,NextAttemptAt,CreatedAt);
IF OBJECT_ID('dbo.Business','U') IS NULL CREATE TABLE dbo.Business (
 BusinessId uniqueidentifier NOT NULL CONSTRAINT PK_Business PRIMARY KEY, Name nvarchar(200) NOT NULL, Description nvarchar(1000) NULL,
 Status nvarchar(20) NOT NULL CONSTRAINT DF_Business_Status DEFAULT 'Active', CreatedAt datetime2 NOT NULL CONSTRAINT DF_Business_Created DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.SocialPlatform','U') IS NULL CREATE TABLE dbo.SocialPlatform (
 SocialPlatformId int IDENTITY PRIMARY KEY, Code nvarchar(30) NOT NULL UNIQUE, Name nvarchar(80) NOT NULL, IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.ExternalConnection','U') IS NULL CREATE TABLE dbo.ExternalConnection (
 ExternalConnectionId uniqueidentifier NOT NULL PRIMARY KEY, Provider nvarchar(40) NOT NULL, ExternalAccountId nvarchar(255) NULL,
 Status nvarchar(20) NOT NULL, ConnectedAt datetime2 NULL, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.ExternalIdentity','U') IS NULL CREATE TABLE dbo.ExternalIdentity (
 ExternalIdentityId uniqueidentifier NOT NULL CONSTRAINT PK_ExternalIdentity PRIMARY KEY,
 Provider nvarchar(40) NOT NULL, ExternalSubject nvarchar(255) NOT NULL,
 UserId uniqueidentifier NOT NULL REFERENCES dbo.AppUser(UserId), CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT UQ_ExternalIdentity_ProviderSubject UNIQUE(Provider,ExternalSubject));
IF OBJECT_ID('dbo.SocialAccount','U') IS NULL CREATE TABLE dbo.SocialAccount (
 SocialAccountId uniqueidentifier NOT NULL PRIMARY KEY, BusinessId uniqueidentifier NOT NULL REFERENCES dbo.Business(BusinessId),
 SocialPlatformId int NOT NULL REFERENCES dbo.SocialPlatform(SocialPlatformId), ExternalConnectionId uniqueidentifier NULL REFERENCES dbo.ExternalConnection(ExternalConnectionId),
 ExternalAccountId nvarchar(255) NOT NULL, Name nvarchar(200) NOT NULL, Status nvarchar(20) NOT NULL DEFAULT 'Disconnected',
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_SocialAccount_External UNIQUE(SocialPlatformId,ExternalAccountId));
IF OBJECT_ID('dbo.UserBusinessPlatformPermission','U') IS NULL CREATE TABLE dbo.UserBusinessPlatformPermission (
 PermissionId uniqueidentifier NOT NULL CONSTRAINT PK_UserBusinessPlatformPermission PRIMARY KEY,
 UserId uniqueidentifier NOT NULL REFERENCES dbo.AppUser(UserId), BusinessId uniqueidentifier NOT NULL REFERENCES dbo.Business(BusinessId),
 SocialPlatformId int NOT NULL REFERENCES dbo.SocialPlatform(SocialPlatformId), IsActive bit NOT NULL DEFAULT 1,
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), CreatedBy uniqueidentifier NOT NULL REFERENCES dbo.AppUser(UserId),
 CONSTRAINT UQ_UserBusinessPlatform UNIQUE(UserId,BusinessId,SocialPlatformId));
IF NOT EXISTS (SELECT 1 FROM dbo.SocialPlatform) INSERT dbo.SocialPlatform(Code,Name) VALUES ('facebook','Facebook'),('instagram','Instagram'),('tiktok','TikTok');
GO
IF OBJECT_ID('dbo.AuthSession','U') IS NULL CREATE TABLE dbo.AuthSession (
 SessionId uniqueidentifier NOT NULL CONSTRAINT PK_AuthSession PRIMARY KEY,
 UserId uniqueidentifier NOT NULL CONSTRAINT FK_AuthSession_AppUser REFERENCES dbo.AppUser(UserId),
 RefreshTokenHash varbinary(32) NOT NULL CONSTRAINT UQ_AuthSession_RefreshHash UNIQUE,
 ExpiresAt datetime2 NOT NULL, CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuthSession_Created DEFAULT SYSUTCDATETIME(),
 LastUsedAt datetime2 NULL, RevokedAt datetime2 NULL
);
IF OBJECT_ID('dbo.AuthSessionTokenHistory','U') IS NULL CREATE TABLE dbo.AuthSessionTokenHistory (
 TokenHash varbinary(32) NOT NULL CONSTRAINT PK_AuthSessionTokenHistory PRIMARY KEY,
 SessionId uniqueidentifier NOT NULL CONSTRAINT FK_AuthSessionTokenHistory_Session REFERENCES dbo.AuthSession(SessionId),
 UsedAt datetime2 NOT NULL CONSTRAINT DF_AuthSessionTokenHistory_Used DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.AuthSession') AND name='IX_AuthSession_UserActive')
 CREATE INDEX IX_AuthSession_UserActive ON dbo.AuthSession(UserId,RevokedAt,ExpiresAt);

CREATE OR ALTER PROCEDURE dbo.usp_Auth_GetActiveUser @UserId uniqueidentifier,@SessionId uniqueidentifier AS
 SET NOCOUNT ON;
 SELECT u.UserId,u.Email,u.DisplayName,u.Role,u.AuthVersion
 FROM dbo.AppUser u JOIN dbo.AuthSession s ON s.UserId=u.UserId
 WHERE u.UserId=@UserId AND u.IsActive=1 AND s.SessionId=@SessionId
   AND s.RevokedAt IS NULL AND s.ExpiresAt>SYSUTCDATETIME();
GO
CREATE OR ALTER PROCEDURE dbo.usp_Auth_FindByEmail @Email nvarchar(320) AS
 SET NOCOUNT ON;
 SELECT TOP (1) UserId,Email,DisplayName,Role,IsActive,PasswordHash,AuthVersion FROM dbo.AppUser WHERE Email=@Email;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Auth_BootstrapAdministrator @Email nvarchar(320),@DisplayName nvarchar(200),@PasswordHash nvarchar(255) AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @lockResult int, @created bit=0;
 BEGIN TRAN;
 EXEC @lockResult=sys.sp_getapplock @Resource=N'AI_MARKETING_MANAGER:first-administrator',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
 IF @lockResult<0 BEGIN ROLLBACK; THROW 51010,'Bootstrap lock unavailable',1; END;
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE Role='Administrador')
 BEGIN
   IF EXISTS(SELECT 1 FROM dbo.AppUser WHERE Email=@Email)
   BEGIN ROLLBACK; THROW 51011,'Bootstrap email already belongs to a non-administrator',1; END;
   INSERT dbo.AppUser(UserId,Email,DisplayName,Role,IsActive,PasswordHash,ActivatedAt) VALUES(NEWID(),@Email,@DisplayName,'Administrador',1,@PasswordHash,SYSUTCDATETIME());
   SET @created=1;
 END;
 COMMIT;
 SELECT @created AS Created;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Auth_GoogleUser @GoogleSubject nvarchar(255) AS
 SET NOCOUNT ON;
 SELECT u.UserId,u.Email,u.DisplayName,u.Role,u.AuthVersion
 FROM dbo.ExternalIdentity i JOIN dbo.AppUser u ON u.UserId=i.UserId
 WHERE i.Provider='Google' AND i.ExternalSubject=@GoogleSubject AND u.IsActive=1;
GO
CREATE OR ALTER PROCEDURE dbo.usp_User_ListForAdmin @ActorUserId uniqueidentifier AS
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
 SELECT UserId,DisplayName,Email,Role,IsActive,CreatedAt FROM dbo.AppUser ORDER BY DisplayName;
GO
CREATE OR ALTER PROCEDURE dbo.usp_User_SetActive @ActorUserId uniqueidentifier,@TargetUserId uniqueidentifier,@IsActive bit AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @lockResult int;
 BEGIN TRAN;
 EXEC @lockResult=sys.sp_getapplock @Resource=N'AI_MARKETING_MANAGER:administrator-lifecycle',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
 IF @lockResult<0 BEGIN ROLLBACK; THROW 51010,'Administrator lifecycle lock unavailable',1; END;
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador')
 BEGIN ROLLBACK; THROW 51001,'Forbidden',1; END;
 DECLARE @targetRole nvarchar(20),@targetExists bit=0;
 SELECT @targetRole=Role,@targetExists=1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@TargetUserId;
 IF @targetExists=0 BEGIN ROLLBACK; THROW 51002,'User not found',1; END;
 IF @IsActive=1 AND NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@TargetUserId AND PasswordHash IS NOT NULL AND ActivatedAt IS NOT NULL)
 BEGIN ROLLBACK; THROW 51013,'Pending user must accept invitation before activation',1; END;
 IF @IsActive=0 AND @targetRole='Administrador' AND (SELECT COUNT(*) FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE Role='Administrador' AND IsActive=1)<=1
 BEGIN ROLLBACK; THROW 51012,'Cannot deactivate the last active administrator',1; END;
 UPDATE dbo.AppUser SET IsActive=@IsActive,AuthVersion=AuthVersion+1 WHERE UserId=@TargetUserId;
 INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,'user.active',CONCAT('IsActive=',CONVERT(nvarchar(1),@IsActive)));
 COMMIT;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Business_ListAuthorized @UserId uniqueidentifier AS
 SELECT b.BusinessId,b.Name,b.Description,b.Status,b.CreatedAt, CAST(CASE WHEN u.Role='Administrador' THEN 1 ELSE 0 END AS bit) IsAdministrator
 FROM dbo.Business b CROSS JOIN dbo.AppUser u WHERE u.UserId=@UserId AND u.IsActive=1 AND b.Status='Active'
 AND (u.Role='Administrador' OR EXISTS(SELECT 1 FROM dbo.UserBusinessPlatformPermission p WHERE p.UserId=u.UserId AND p.BusinessId=b.BusinessId AND p.IsActive=1));
GO
CREATE OR ALTER PROCEDURE dbo.usp_Permission_ListForAdmin @ActorUserId uniqueidentifier,@TargetUserId uniqueidentifier AS
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@TargetUserId AND Role='Viewer') THROW 51002,'Viewer not found',1;
 SELECT b.BusinessId,b.Name BusinessName,p.SocialPlatformId,s.Code PlatformCode,s.Name PlatformName,COALESCE(p.IsActive,0) IsActive
 FROM dbo.Business b CROSS JOIN dbo.SocialPlatform s LEFT JOIN dbo.UserBusinessPlatformPermission p
 ON p.BusinessId=b.BusinessId AND p.SocialPlatformId=s.SocialPlatformId AND p.UserId=@TargetUserId
 WHERE b.Status='Active' AND s.IsActive=1 ORDER BY b.Name,s.Name;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Permission_SaveForViewer @ActorUserId uniqueidentifier,@TargetUserId uniqueidentifier,@Assignments nvarchar(max) AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@TargetUserId AND Role='Viewer') THROW 51002,'Viewer not found',1;
 IF ISJSON(@Assignments)<>1 THROW 51003,'Invalid assignments',1;
 IF EXISTS(SELECT BusinessId,SocialPlatformId FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId') GROUP BY BusinessId,SocialPlatformId HAVING COUNT(*)>1) THROW 51003,'Duplicate assignments',1;
 DECLARE @A TABLE(BusinessId uniqueidentifier,SocialPlatformId int,IsActive bit,PRIMARY KEY(BusinessId,SocialPlatformId));
 INSERT @A SELECT BusinessId,SocialPlatformId,IsActive FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId',IsActive bit '$.isActive');
 IF NOT EXISTS(SELECT 1 FROM @A WHERE IsActive=1) THROW 51003,'Viewer requires at least one active permission',1;
 IF EXISTS(SELECT 1 FROM @A a LEFT JOIN dbo.Business b ON b.BusinessId=a.BusinessId LEFT JOIN dbo.SocialPlatform s ON s.SocialPlatformId=a.SocialPlatformId WHERE b.BusinessId IS NULL OR b.Status<>'Active' OR s.SocialPlatformId IS NULL OR s.IsActive=0) THROW 51004,'Unknown business or platform',1;
 BEGIN TRY
   BEGIN TRAN;
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@TargetUserId AND Role='Viewer') THROW 51002,'Viewer not found',1;
   UPDATE p SET IsActive=COALESCE(a.IsActive,0) FROM dbo.UserBusinessPlatformPermission p LEFT JOIN @A a ON a.BusinessId=p.BusinessId AND a.SocialPlatformId=p.SocialPlatformId WHERE p.UserId=@TargetUserId;
   MERGE dbo.UserBusinessPlatformPermission AS p USING (SELECT * FROM @A WHERE IsActive=1) AS a ON p.UserId=@TargetUserId AND p.BusinessId=a.BusinessId AND p.SocialPlatformId=a.SocialPlatformId
   WHEN MATCHED THEN UPDATE SET IsActive=1
   WHEN NOT MATCHED THEN INSERT(PermissionId,UserId,BusinessId,SocialPlatformId,IsActive,CreatedBy) VALUES(NEWID(),@TargetUserId,a.BusinessId,a.SocialPlatformId,1,@ActorUserId);
   INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,'user.permissions_changed',CONCAT('Active assignments=',(SELECT COUNT(*) FROM @A WHERE IsActive=1)));
   COMMIT;
 END TRY
 BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SocialAccount_ListAuthorized @UserId uniqueidentifier,@BusinessId uniqueidentifier=NULL,@SocialPlatformId int=NULL AS
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@UserId AND IsActive=1) THROW 51005,'Unauthorized',1;
 SELECT a.SocialAccountId,a.BusinessId,b.Name BusinessName,a.SocialPlatformId,p.Code PlatformCode,a.ExternalAccountId,a.Name,a.Status,a.ExternalConnectionId
 FROM dbo.SocialAccount a JOIN dbo.Business b ON b.BusinessId=a.BusinessId JOIN dbo.SocialPlatform p ON p.SocialPlatformId=a.SocialPlatformId
 JOIN dbo.AppUser u ON u.UserId=@UserId
 WHERE a.Status='Connected' AND b.Status='Active' AND (@BusinessId IS NULL OR a.BusinessId=@BusinessId) AND (@SocialPlatformId IS NULL OR a.SocialPlatformId=@SocialPlatformId)
 AND (u.Role='Administrador' OR EXISTS(SELECT 1 FROM dbo.UserBusinessPlatformPermission x WHERE x.UserId=@UserId AND x.BusinessId=a.BusinessId AND x.SocialPlatformId=a.SocialPlatformId AND x.IsActive=1));
GO
/* Reutilizar este predicado en cada SP de métricas, publicaciones y reportes. */
CREATE OR ALTER PROCEDURE dbo.usp_SocialData_AuthorizationPredicate @UserId uniqueidentifier,@BusinessId uniqueidentifier,@SocialPlatformId int AS
 IF NOT EXISTS(SELECT 1 FROM dbo.AppUser u WHERE u.UserId=@UserId AND u.IsActive=1 AND (u.Role='Administrador' OR EXISTS(
 SELECT 1 FROM dbo.UserBusinessPlatformPermission p WHERE p.UserId=u.UserId AND p.BusinessId=@BusinessId AND p.SocialPlatformId=@SocialPlatformId AND p.IsActive=1))) THROW 51006,'Forbidden',1;
GO
CREATE OR ALTER PROCEDURE dbo.usp_User
 @accion nvarchar(20),@ActorUserId uniqueidentifier=NULL,@TargetUserId uniqueidentifier=NULL,
 @Email nvarchar(320)=NULL,@DisplayName nvarchar(200)=NULL,@Role nvarchar(20)=NULL,@IsActive bit=NULL,
 @Assignments nvarchar(max)=NULL,@TokenHash varbinary(32)=NULL,@ExpiresAt datetime2=NULL,@PayloadEncrypted nvarchar(max)=NULL AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @accion='list'
 BEGIN
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
   SELECT u.UserId,u.DisplayName,u.Email,u.Role,u.IsActive,u.CreatedAt,u.ActivatedAt,
     CASE WHEN u.IsActive=1 THEN 'Active' WHEN u.ActivatedAt IS NULL AND EXISTS(SELECT 1 FROM dbo.UserInvitation i WHERE i.UserId=u.UserId AND i.AcceptedAt IS NULL AND i.RevokedAt IS NULL AND i.ExpiresAt>SYSUTCDATETIME()) THEN 'Invited' WHEN u.ActivatedAt IS NULL THEN 'InvitationRequired' ELSE 'Inactive' END InvitationStatus
   FROM dbo.AppUser u ORDER BY u.DisplayName; RETURN;
 END;
 IF @accion='get'
 BEGIN
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
   SELECT u.UserId,u.DisplayName,u.Email,u.Role,u.IsActive,u.CreatedAt,u.ActivatedAt,
     CASE WHEN u.IsActive=1 THEN 'Active' WHEN u.ActivatedAt IS NULL AND EXISTS(SELECT 1 FROM dbo.UserInvitation i WHERE i.UserId=u.UserId AND i.AcceptedAt IS NULL AND i.RevokedAt IS NULL AND i.ExpiresAt>SYSUTCDATETIME()) THEN 'Invited' WHEN u.ActivatedAt IS NULL THEN 'InvitationRequired' ELSE 'Inactive' END InvitationStatus
   FROM dbo.AppUser u WHERE u.UserId=@TargetUserId; RETURN;
 END;
 IF @accion='assignment_options'
 BEGIN
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
   SELECT b.BusinessId,b.Name BusinessName,s.SocialPlatformId,s.Code PlatformCode,s.Name PlatformName
   FROM dbo.Business b CROSS JOIN dbo.SocialPlatform s
   WHERE b.Status='Active' AND s.IsActive=1 ORDER BY b.Name,s.Name;
   RETURN;
 END;
 IF @accion='create'
 BEGIN
   IF @Email IS NULL OR @DisplayName IS NULL OR @Role NOT IN ('Administrador','Viewer') THROW 51014,'Invalid user fields',1;
   IF @TokenHash IS NULL OR DATALENGTH(@TokenHash)<>32 OR @ExpiresAt<=SYSUTCDATETIME() OR @PayloadEncrypted IS NULL THROW 51015,'Invalid invitation data',1;
   DECLARE @NormalizedEmail nvarchar(320)=LOWER(LTRIM(RTRIM(@Email)));
   DECLARE @A TABLE(BusinessId uniqueidentifier NOT NULL,SocialPlatformId int NOT NULL,PRIMARY KEY(BusinessId,SocialPlatformId));
   IF @Role='Viewer'
   BEGIN
     IF ISJSON(@Assignments)<>1 OR LEFT(LTRIM(@Assignments),1)<>'[' THROW 51003,'Invalid assignments',1;
     IF EXISTS(SELECT BusinessId,SocialPlatformId FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId') GROUP BY BusinessId,SocialPlatformId HAVING COUNT(*)>1) THROW 51003,'Duplicate assignments',1;
     INSERT @A SELECT BusinessId,SocialPlatformId FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId');
     IF NOT EXISTS(SELECT 1 FROM @A) THROW 51003,'Viewer requires permissions',1;
     IF EXISTS(SELECT 1 FROM @A a LEFT JOIN dbo.Business b ON b.BusinessId=a.BusinessId LEFT JOIN dbo.SocialPlatform s ON s.SocialPlatformId=a.SocialPlatformId WHERE b.BusinessId IS NULL OR b.Status<>'Active' OR s.SocialPlatformId IS NULL OR s.IsActive=0) THROW 51004,'Unknown business or platform',1;
   END;
   BEGIN TRY
     BEGIN TRAN;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
     IF EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE Email=@NormalizedEmail) THROW 51016,'Duplicate email',1;
     IF EXISTS(SELECT 1 FROM @A a LEFT JOIN dbo.Business b ON b.BusinessId=a.BusinessId LEFT JOIN dbo.SocialPlatform s ON s.SocialPlatformId=a.SocialPlatformId WHERE b.BusinessId IS NULL OR b.Status<>'Active' OR s.SocialPlatformId IS NULL OR s.IsActive=0) THROW 51004,'Unknown business or platform',1;
     INSERT dbo.AppUser(UserId,Email,DisplayName,Role,IsActive,PasswordHash,ActivatedAt) VALUES(@TargetUserId,@NormalizedEmail,LTRIM(RTRIM(@DisplayName)),@Role,0,NULL,NULL);
     INSERT dbo.UserBusinessPlatformPermission(PermissionId,UserId,BusinessId,SocialPlatformId,IsActive,CreatedBy)
       SELECT NEWID(),@TargetUserId,BusinessId,SocialPlatformId,1,@ActorUserId FROM @A;
     INSERT dbo.UserInvitation(InvitationId,UserId,TokenHash,ExpiresAt) VALUES(NEWID(),@TargetUserId,@TokenHash,@ExpiresAt);
     INSERT dbo.EmailOutbox(OutboxId,UserId,MessageType,PayloadEncrypted) VALUES(NEWID(),@TargetUserId,'invitation',@PayloadEncrypted);
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,'user.created',CONCAT('Role=',@Role));
     COMMIT;
     SELECT UserId,Email,DisplayName,Role,IsActive,CreatedAt,ActivatedAt FROM dbo.AppUser WHERE UserId=@TargetUserId;
   END TRY
   BEGIN CATCH
     IF XACT_STATE()<>0 ROLLBACK;
     THROW;
   END CATCH;
   RETURN;
 END;
 IF @accion='update'
 BEGIN
   IF @Email IS NULL OR @DisplayName IS NULL THROW 51014,'Invalid user fields',1;
   BEGIN TRY
     BEGIN TRAN;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@TargetUserId) THROW 51002,'User not found',1;
     IF EXISTS(SELECT 1 FROM dbo.AppUser WHERE Email=LOWER(LTRIM(RTRIM(@Email))) AND UserId<>@TargetUserId) THROW 51016,'Duplicate email',1;
     UPDATE dbo.AppUser SET Email=LOWER(LTRIM(RTRIM(@Email))),DisplayName=LTRIM(RTRIM(@DisplayName)) WHERE UserId=@TargetUserId;
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,'user.updated','Profile changed');
     COMMIT;
     SELECT UserId,Email,DisplayName,Role,IsActive,CreatedAt,ActivatedAt FROM dbo.AppUser WHERE UserId=@TargetUserId;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 IF @accion='role'
 BEGIN
   IF @Role NOT IN ('Administrador','Viewer') THROW 51014,'Invalid role',1;
   DECLARE @OldRole nvarchar(20),@RoleLock int;
   BEGIN TRY
     BEGIN TRAN;
     EXEC @RoleLock=sys.sp_getapplock @Resource=N'AI_MARKETING_MANAGER:administrator-lifecycle',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
     IF @RoleLock<0 THROW 51010,'Administrator lifecycle lock unavailable',1;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
     SELECT @OldRole=Role FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@TargetUserId;
     IF @OldRole IS NULL THROW 51002,'Active user not found',1;
     IF @OldRole='Administrador' AND @Role='Viewer'
     BEGIN
       IF EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@TargetUserId AND IsActive=1) AND (SELECT COUNT(*) FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE Role='Administrador' AND IsActive=1)<=1 THROW 51012,'Cannot demote the last active administrator',1;
       IF ISJSON(@Assignments)<>1 OR LEFT(LTRIM(@Assignments),1)<>'[' THROW 51003,'Viewer requires permissions',1;
       DECLARE @R TABLE(BusinessId uniqueidentifier NOT NULL,SocialPlatformId int NOT NULL,PRIMARY KEY(BusinessId,SocialPlatformId));
       IF EXISTS(SELECT BusinessId,SocialPlatformId FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId') GROUP BY BusinessId,SocialPlatformId HAVING COUNT(*)>1) THROW 51003,'Duplicate assignments',1;
       INSERT @R SELECT BusinessId,SocialPlatformId FROM OPENJSON(@Assignments) WITH (BusinessId uniqueidentifier '$.businessId',SocialPlatformId int '$.socialPlatformId');
       IF NOT EXISTS(SELECT 1 FROM @R) THROW 51003,'Viewer requires permissions',1;
       IF EXISTS(SELECT 1 FROM @R a LEFT JOIN dbo.Business b ON b.BusinessId=a.BusinessId LEFT JOIN dbo.SocialPlatform s ON s.SocialPlatformId=a.SocialPlatformId WHERE b.BusinessId IS NULL OR b.Status<>'Active' OR s.SocialPlatformId IS NULL OR s.IsActive=0) THROW 51004,'Unknown business or platform',1;
       UPDATE dbo.UserBusinessPlatformPermission SET IsActive=0 WHERE UserId=@TargetUserId;
       MERGE dbo.UserBusinessPlatformPermission AS p USING @R AS r ON p.UserId=@TargetUserId AND p.BusinessId=r.BusinessId AND p.SocialPlatformId=r.SocialPlatformId
       WHEN MATCHED THEN UPDATE SET IsActive=1
       WHEN NOT MATCHED THEN INSERT(PermissionId,UserId,BusinessId,SocialPlatformId,IsActive,CreatedBy) VALUES(NEWID(),@TargetUserId,r.BusinessId,r.SocialPlatformId,1,@ActorUserId);
     END;
     IF @OldRole='Viewer' AND @Role='Administrador' UPDATE dbo.UserBusinessPlatformPermission SET IsActive=0 WHERE UserId=@TargetUserId;
     UPDATE dbo.AppUser SET Role=@Role WHERE UserId=@TargetUserId;
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,'user.role_changed',CONCAT(@OldRole,'->',@Role));
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 THROW 51017,'Unknown user action',1;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Invitation
 @accion nvarchar(20),@ActorUserId uniqueidentifier=NULL,@TargetUserId uniqueidentifier=NULL,
 @TokenHash varbinary(32)=NULL,@ExpiresAt datetime2=NULL,@PayloadEncrypted nvarchar(max)=NULL,@PasswordHash nvarchar(255)=NULL AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @accion='validate'
 BEGIN
   SELECT TOP(1) i.UserId,u.Email,u.DisplayName,u.Role,i.ExpiresAt
   FROM dbo.UserInvitation i JOIN dbo.AppUser u ON u.UserId=i.UserId
   WHERE i.TokenHash=@TokenHash AND i.AcceptedAt IS NULL AND i.RevokedAt IS NULL AND i.ExpiresAt>SYSUTCDATETIME() AND u.IsActive=0 AND u.ActivatedAt IS NULL;
   RETURN;
 END;
 IF @accion='accept'
 BEGIN
   IF @PasswordHash IS NULL OR @TokenHash IS NULL THROW 51018,'Invalid invitation',1;
   BEGIN TRY
     BEGIN TRAN;
     DECLARE @InviteUserId uniqueidentifier;
     SELECT @InviteUserId=i.UserId FROM dbo.UserInvitation i WITH (UPDLOCK,HOLDLOCK) JOIN dbo.AppUser u WITH (UPDLOCK,HOLDLOCK) ON u.UserId=i.UserId
     WHERE i.TokenHash=@TokenHash AND i.AcceptedAt IS NULL AND i.RevokedAt IS NULL AND i.ExpiresAt>SYSUTCDATETIME() AND u.IsActive=0 AND u.ActivatedAt IS NULL;
     IF @InviteUserId IS NULL THROW 51019,'Invitation is invalid or expired',1;
     UPDATE dbo.AppUser SET PasswordHash=@PasswordHash,IsActive=1,ActivatedAt=SYSUTCDATETIME(),AuthVersion=AuthVersion+1 WHERE UserId=@InviteUserId;
     UPDATE dbo.UserInvitation SET AcceptedAt=SYSUTCDATETIME() WHERE TokenHash=@TokenHash;
     UPDATE dbo.UserInvitation SET RevokedAt=SYSUTCDATETIME() WHERE UserId=@InviteUserId AND TokenHash<>@TokenHash AND AcceptedAt IS NULL AND RevokedAt IS NULL;
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(NULL,@InviteUserId,'invitation.accepted','Account activated');
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 IF @accion='resend' OR @accion='revoke'
 BEGIN
   BEGIN TRY
     BEGIN TRAN;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@ActorUserId AND IsActive=1 AND Role='Administrador') THROW 51001,'Forbidden',1;
     IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@TargetUserId AND IsActive=0 AND ActivatedAt IS NULL) THROW 51002,'Pending user not found',1;
     UPDATE dbo.UserInvitation SET RevokedAt=SYSUTCDATETIME() WHERE UserId=@TargetUserId AND AcceptedAt IS NULL AND RevokedAt IS NULL;
     IF @accion='resend'
     BEGIN
       IF @TokenHash IS NULL OR DATALENGTH(@TokenHash)<>32 OR @ExpiresAt<=SYSUTCDATETIME() OR @PayloadEncrypted IS NULL THROW 51015,'Invalid invitation data',1;
       INSERT dbo.UserInvitation(InvitationId,UserId,TokenHash,ExpiresAt) VALUES(NEWID(),@TargetUserId,@TokenHash,@ExpiresAt);
       INSERT dbo.EmailOutbox(OutboxId,UserId,MessageType,PayloadEncrypted) VALUES(NEWID(),@TargetUserId,'invitation',@PayloadEncrypted);
     END;
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(@ActorUserId,@TargetUserId,CONCAT('invitation.',@accion),NULL);
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 THROW 51017,'Unknown invitation action',1;
GO
CREATE OR ALTER PROCEDURE dbo.usp_PasswordReset
 @accion nvarchar(20),@Email nvarchar(320)=NULL,@TokenHash varbinary(32)=NULL,@ExpiresAt datetime2=NULL,
 @PayloadEncrypted nvarchar(max)=NULL,@PasswordHash nvarchar(255)=NULL AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @accion='request'
 BEGIN
   BEGIN TRY
     BEGIN TRAN;
     DECLARE @ResetUserId uniqueidentifier;
     SELECT @ResetUserId=UserId FROM dbo.AppUser WITH (UPDLOCK,HOLDLOCK) WHERE Email=LOWER(LTRIM(RTRIM(@Email))) AND IsActive=1 AND PasswordHash IS NOT NULL;
     IF @ResetUserId IS NOT NULL
     BEGIN
       UPDATE dbo.PasswordResetToken SET RevokedAt=SYSUTCDATETIME() WHERE UserId=@ResetUserId AND UsedAt IS NULL AND RevokedAt IS NULL;
       IF @TokenHash IS NOT NULL AND DATALENGTH(@TokenHash)=32 AND @ExpiresAt>SYSUTCDATETIME() AND @PayloadEncrypted IS NOT NULL
       BEGIN
         INSERT dbo.PasswordResetToken(ResetTokenId,UserId,TokenHash,ExpiresAt) VALUES(NEWID(),@ResetUserId,@TokenHash,@ExpiresAt);
         INSERT dbo.EmailOutbox(OutboxId,UserId,MessageType,PayloadEncrypted) VALUES(NEWID(),@ResetUserId,'password_reset',@PayloadEncrypted);
       END;
     END;
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 IF @accion='reset'
 BEGIN
   BEGIN TRY
     BEGIN TRAN;
     DECLARE @ResetUser uniqueidentifier;
     SELECT @ResetUser=UserId FROM dbo.PasswordResetToken WITH (UPDLOCK,HOLDLOCK) WHERE TokenHash=@TokenHash AND UsedAt IS NULL AND RevokedAt IS NULL AND ExpiresAt>SYSUTCDATETIME();
     IF @ResetUser IS NULL THROW 51020,'Reset token is invalid or expired',1;
     UPDATE dbo.AppUser SET PasswordHash=@PasswordHash,AuthVersion=AuthVersion+1 WHERE UserId=@ResetUser AND IsActive=1;
     IF @@ROWCOUNT=0 THROW 51020,'Reset token is invalid or expired',1;
     UPDATE dbo.PasswordResetToken SET UsedAt=SYSUTCDATETIME() WHERE TokenHash=@TokenHash;
     UPDATE dbo.PasswordResetToken SET RevokedAt=SYSUTCDATETIME() WHERE UserId=@ResetUser AND TokenHash<>@TokenHash AND UsedAt IS NULL AND RevokedAt IS NULL;
     INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(NULL,@ResetUser,'password.reset','Sessions revoked by AuthVersion increment');
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 THROW 51017,'Unknown password reset action',1;
GO
CREATE OR ALTER PROCEDURE dbo.usp_EmailOutbox
 @accion nvarchar(20),@OutboxId uniqueidentifier=NULL,@Sent bit=NULL,@ErrorCode nvarchar(80)=NULL AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @accion='claim'
 BEGIN
   DECLARE @Claimed TABLE(OutboxId uniqueidentifier,UserId uniqueidentifier,MessageType nvarchar(40),PayloadEncrypted nvarchar(max));
   BEGIN TRAN;
   ;WITH next_items AS (
     SELECT TOP(10) * FROM dbo.EmailOutbox WITH (UPDLOCK,READPAST,ROWLOCK)
     WHERE (Status IN ('Pending','Failed') AND NextAttemptAt<=SYSUTCDATETIME() AND AttemptCount<8)
        OR (Status='Sending' AND LastAttemptAt<DATEADD(minute,-10,SYSUTCDATETIME()))
     ORDER BY CreatedAt)
   UPDATE next_items SET Status='Sending',LastAttemptAt=SYSUTCDATETIME()
   OUTPUT inserted.OutboxId,inserted.UserId,inserted.MessageType,inserted.PayloadEncrypted INTO @Claimed;
   COMMIT;
   SELECT * FROM @Claimed;
   RETURN;
 END;
 IF @accion='sent'
 BEGIN
   UPDATE dbo.EmailOutbox SET Status='Sent',SentAt=SYSUTCDATETIME(),AttemptCount=AttemptCount+1,LastErrorCode=NULL WHERE OutboxId=@OutboxId;
   RETURN;
 END;
 IF @accion='failed'
 BEGIN
   UPDATE dbo.EmailOutbox SET AttemptCount=AttemptCount+1,Status=CASE WHEN AttemptCount+1>=8 THEN 'Failed' ELSE 'Pending' END,
     NextAttemptAt=DATEADD(minute,CASE WHEN AttemptCount<1 THEN 1 WHEN AttemptCount<4 THEN 5 ELSE 30 END,SYSUTCDATETIME()),LastErrorCode=@ErrorCode WHERE OutboxId=@OutboxId;
   RETURN;
 END;
 THROW 51017,'Unknown outbox action',1;
GO

GO
CREATE OR ALTER PROCEDURE dbo.usp_Auth_Session
 @accion nvarchar(20),@UserId uniqueidentifier=NULL,@SessionId uniqueidentifier=NULL,
 @TokenHash varbinary(32)=NULL,@NewTokenHash varbinary(32)=NULL,@ExpiresAt datetime2=NULL AS
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @accion='create'
 BEGIN
   IF @UserId IS NULL OR @SessionId IS NULL OR @TokenHash IS NULL OR DATALENGTH(@TokenHash)<>32 OR @ExpiresAt<=SYSUTCDATETIME() THROW 51030,'Invalid session data',1;
   IF NOT EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserId=@UserId AND IsActive=1) THROW 51031,'User is inactive',1;
   INSERT dbo.AuthSession(SessionId,UserId,RefreshTokenHash,ExpiresAt) VALUES(@SessionId,@UserId,@TokenHash,@ExpiresAt);
   SELECT @SessionId SessionId,@UserId UserId;
   RETURN;
 END;
 IF @accion='rotate'
 BEGIN
   IF @TokenHash IS NULL OR DATALENGTH(@TokenHash)<>32 OR @NewTokenHash IS NULL OR DATALENGTH(@NewTokenHash)<>32 OR @ExpiresAt<=SYSUTCDATETIME() THROW 51030,'Invalid refresh token data',1;
   BEGIN TRY
     BEGIN TRAN;
     DECLARE @FoundSession uniqueidentifier,@FoundUser uniqueidentifier,@CurrentHash varbinary(32);
     SELECT @FoundSession=SessionId,@FoundUser=UserId,@CurrentHash=RefreshTokenHash
       FROM dbo.AuthSession WITH (UPDLOCK,HOLDLOCK)
       WHERE RefreshTokenHash=@TokenHash AND RevokedAt IS NULL AND ExpiresAt>SYSUTCDATETIME();
     IF @FoundSession IS NULL
     BEGIN
       SELECT @FoundSession=SessionId,@FoundUser=UserId FROM dbo.AuthSessionTokenHistory WITH (UPDLOCK,HOLDLOCK) WHERE TokenHash=@TokenHash;
       IF @FoundSession IS NOT NULL
       BEGIN
         UPDATE dbo.AuthSession SET RevokedAt=SYSUTCDATETIME() WHERE SessionId=@FoundSession AND RevokedAt IS NULL;
         INSERT dbo.AuditLog(ActorUserId,TargetUserId,Action,Details) VALUES(NULL,@FoundUser,'session.refresh_reuse_detected','Session revoked after reuse of a rotated refresh token');
         COMMIT;
         THROW 51032,'Refresh token reuse detected',1;
       END;
       ROLLBACK;
       THROW 51033,'Refresh token is invalid or expired',1;
     END;
     IF EXISTS(SELECT 1 FROM dbo.AuthSessionTokenHistory WHERE TokenHash=@NewTokenHash) THROW 51030,'Refresh token collision',1;
     INSERT dbo.AuthSessionTokenHistory(TokenHash,SessionId) VALUES(@CurrentHash,@FoundSession);
     UPDATE dbo.AuthSession SET RefreshTokenHash=@NewTokenHash,ExpiresAt=@ExpiresAt,LastUsedAt=SYSUTCDATETIME() WHERE SessionId=@FoundSession;
     SELECT s.SessionId,u.UserId,u.AuthVersion,u.Email,u.DisplayName,u.Role
       FROM dbo.AuthSession s JOIN dbo.AppUser u ON u.UserId=s.UserId
       WHERE s.SessionId=@FoundSession AND u.IsActive=1;
     COMMIT;
   END TRY
   BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
   RETURN;
 END;
 IF @accion='revoke'
 BEGIN
   UPDATE dbo.AuthSession SET RevokedAt=SYSUTCDATETIME() WHERE RefreshTokenHash=@TokenHash AND RevokedAt IS NULL;
   RETURN;
 END;
 IF @accion='revoke_all'
 BEGIN
   UPDATE dbo.AuthSession SET RevokedAt=SYSUTCDATETIME() WHERE UserId=@UserId AND RevokedAt IS NULL;
   RETURN;
 END;
 THROW 51034,'Unknown session action',1;
GO
