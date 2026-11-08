# Auditoría técnica de Fase 2

**Fecha:** 2026-11-02  
**Alcance:** auditoría estática de solo lectura del repositorio disponible. No se usaron credenciales, no se llamó a proveedores OAuth y no se ejecutaron migraciones ni escrituras.

## 1. Resumen ejecutivo

La Fase 2 está **parcialmente implementada y no es apta para producción**. Existe un esquema pequeño para usuarios, identidades externas y permisos por comercio/plataforma, más un flujo Google OAuth y endpoints de lectura/edición de permisos. No existe autenticación por contraseña, bootstrap de Administrador, invitaciones, recuperación, sesiones persistentes ni pruebas de autorización de API/SQL.

Hallazgos principales:

- **Crítico:** el inicio de Google crea automáticamente un Viewer cuando no encuentra identidad ni correo, en contra de la política de alta exclusiva por Administrador e invitación. La ruta permite así el registro público.
- **Alto:** JWT y acceso a SQL están implementados dentro de Presentation; las rutas importan `mssql` y usan `getPool()` directamente. No hay Repositories ni casos de uso que medien el acceso.
- **Alto:** faltan Refresh Tokens, rotación, revocación, sesiones, recuperación, invitaciones, activación y login con contraseña.
- **Alto:** el permiso asignado a un Viewer no se exige al crearlo (no hay creación real), y el procedimiento permite guardar una lista vacía o sin ningún `IsActive=1`.
- **Alto:** no existen usuarios iniciales ni datos de comercios; no se puede iniciar sesión como Administrador desde una instalación nueva mediante un flujo documentado/implementado.
- **Alto:** no hay endpoints de métricas/publicaciones/reportes. Por ello no puede probarse la autorización de datos comerciales; las vistas de negocio consumen mocks para Administrador y modo demo.
- La matriz UI permite editar pares comercio/plataforma para usuarios Viewer existentes, pero los usuarios, altas, cambios de rol y activaciones de la pantalla son mocks.
- La documentación presenta algunas capacidades como listas para uso —por ejemplo, que los nuevos SP deberán aplicar el predicado— pero ello es una instrucción futura, no un control ejecutado por endpoints de datos.

## 2. Estado general de Fase 2

**Estado: PARCIAL.** La base mínima de permisos y el callback Google están escritos, pero hay brechas funcionales y de arquitectura que impiden considerar completa la autenticación, la administración de usuarios y el aislamiento de datos. No se intentó completar flujos con cuentas reales.

## 3. Estructura real del repositorio

Backend `backend/src/`:

- `Domain/Entities`, `Domain/Interfaces`, `Domain/Exceptions`: sólo `.gitkeep`; sin entidades, contratos ni reglas de dominio.
- `Application/UseCases`, `Application/DTOs`, `Application/Services`: sólo `.gitkeep`; sin casos de uso ni DTOs.
- `Infrastructure/Database/Connection/sqlServer.js`: pool SQL Server y health check.
- `Infrastructure/Database/StoredProcedures/phase-2.sql`: esquema y procedimientos Fase 2.
- `Infrastructure/Database/initialize.js`: bootstrap de base/login, aplica batches SQL y concede EXECUTE.
- `Infrastructure/Cache` y `Infrastructure/Storage`: adaptadores de Redis y MinIO, ajenos al flujo de permisos actual.
- `Presentation/Middlewares/authenticate.js`: validación JWT y rol.
- `Presentation/Routes/accessRoutes.js`, `googleAuthRoutes.js`: rutas y acceso directo a SQL.
- `main.js`: ensamblado Express, health checks y montaje de rutas.

Frontend: React/Vite en `frontend/src/`; módulos, shell y catálogo central en `mock/marketingData.js`. Existe una sola suite E2E `frontend/e2e/phase-1.spec.js`, relativa a Fase 1.

No se hallaron controladores separados, repositorios, interfaces de persistencia, validadores compartidos, servicios de autenticación ni documentación de endpoints. No se observaron archivos duplicados de implementación Fase 2; sí hay documentación descriptiva repetida entre `docs/architecture.md`, `docs/database.md` y `docs/frontend.md`, con alcance parcialmente aspiracional.

## 4. Arquitectura encontrada

Las carpetas siguen nominalmente Clean Architecture, pero no hay implementación de Domain/Application. Presentation importa `mssql` e Infrastructure (`getPool`) desde ambas rutas; los handlers validan, coordinan acceso a datos, traducen resultados y emiten respuestas HTTP. La emisión JWT está en `googleAuthRoutes.js`, también en Presentation. Infrastructure no depende de las capas internas; no se identificó dependencia de Application hacia Infrastructure porque Application está vacía.

La lógica de autorización está duplicada entre middleware (`requireAdministrator`) y SP (comprobación de Administrador). Los SP son autoridad adicional útil, pero el diseño no está encapsulado en repositorios/casos de uso.

## 5. Inventario de tablas

El único script encontrado es `backend/src/Infrastructure/Database/StoredProcedures/phase-2.sql`. Todas las entidades listadas se crean bajo `dbo`; no hay scripts adicionales en `database/scripts/` (sólo `.gitkeep`). El nombre de base viene de `SQLSERVER_DATABASE` con default `AI_MARKETING_MANAGER`; no hay otro motor relacional configurado.

| Tabla real | Columnas y restricciones visibles | Observaciones frente al modelo acordado |
|---|---|---|
| `dbo.AppUser` | `UserId uniqueidentifier` PK; `Email nvarchar(320)` NOT NULL UNIQUE; `DisplayName nvarchar(200)` NOT NULL; `Role nvarchar(20)` NOT NULL CHECK en `Administrador`,`Viewer`; `IsActive bit` default 1; `CreatedAt datetime2` default UTC. | No password hash, estado de invitación/activación, fecha de alta de credencial, auditoría de cambios ni control de primer Administrador. |
| `dbo.Business` | `BusinessId uniqueidentifier` PK; `Name nvarchar(200)` NOT NULL; `Description nvarchar(1000)` NULL; `Status nvarchar(20)` default `Active`; `CreatedAt datetime2` default UTC. | Sin índice adicional ni catálogo de propietarios; actualmente no hay datos seed de comercios. |
| `dbo.SocialPlatform` | `SocialPlatformId int IDENTITY` PK; `Code nvarchar(30)` UNIQUE NOT NULL; `Name nvarchar(80)` NOT NULL; `IsActive bit` default 1. | Seed Facebook/Instagram/TikTok condicional por tabla vacía. |
| `dbo.ExternalConnection` | `ExternalConnectionId uniqueidentifier` PK; `Provider nvarchar(40)` NOT NULL; `ExternalAccountId nvarchar(255)` NULL; `Status nvarchar(20)` NOT NULL; `ConnectedAt datetime2` NULL; `CreatedAt datetime2` default UTC. | Sin relación con usuario/negocio, tokens cifrados, expiración, auditoría o restricciones de estado. No es la sesión de usuario. |
| `dbo.ExternalIdentity` | `ExternalIdentityId uniqueidentifier` PK; `Provider nvarchar(40)`, `ExternalSubject nvarchar(255)` NOT NULL; `UserId uniqueidentifier` FK a AppUser; `CreatedAt datetime2` default UTC; UNIQUE `(Provider,ExternalSubject)`. | Identidad Google por `sub` soportada. No hay auditoría/flujo explícito de vinculación. |
| `dbo.SocialAccount` | `SocialAccountId uniqueidentifier` PK; `BusinessId` FK; `SocialPlatformId` FK; `ExternalConnectionId` NULL FK; `ExternalAccountId nvarchar(255)`, `Name nvarchar(200)` NOT NULL; `Status nvarchar(20)` default `Disconnected`; `CreatedAt datetime2` default UTC; UNIQUE `(SocialPlatformId,ExternalAccountId)`. | No se ve constraint de estado ni índice compuesto para consultas de autorización. |
| `dbo.UserBusinessPlatformPermission` | `PermissionId uniqueidentifier` PK; `UserId`, `BusinessId`, `SocialPlatformId` NOT NULL FKs; `IsActive bit` default 1; `CreatedAt datetime2` default UTC; `CreatedBy` FK a AppUser; UNIQUE `(UserId,BusinessId,SocialPlatformId)`. | El par de asignación coincide con decisión. Sin campos de revocación, revocador o historial; estado se sobreescribe. |

No existen `ROLE` (el rol es texto con CHECK), `USERAUTHIDENTITY` (equivalente parcial `ExternalIdentity`), `REFRESHTOKEN`, `PASSWORDRESETTOKEN`, `USERINVITATION` ni `AUDITLOG`. Tampoco hay tabla de sesiones, credenciales, historial de permisos o registro de acciones. Las FKs declaradas mantienen referencias; no se definen acciones `ON DELETE`. No se observaron índices explícitos fuera de PK/UNIQUE. No se inspeccionó una base viva para confirmar que el esquema instalado coincide con el archivo.

## 6. Inventario de Stored Procedures

No hay procedimientos con `@accion`; cada operación está separada por nombre. Salvo `usp_Auth_GoogleUser` y `usp_Permission_SaveForViewer`, no se declaran transacciones. No hay auditoría persistida. En todos los casos el usuario efectivo llega como parámetro desde el backend; el procedimiento comprueba estado/rol donde se indica.

| Procedimiento | Parámetros / tablas | Lectura, escritura, validación y estado |
|---|---|---|
| `dbo.usp_Auth_GetActiveUser` | `@UserId uniqueidentifier`; AppUser. | Lee usuario activo. Sin control de rol; usado para recargar actor. Implementado, no probado en SQL. |
| `dbo.usp_Auth_GoogleUser` | `@GoogleSubject nvarchar(255)`, `@Email nvarchar(320)`, `@DisplayName nvarchar(200)`; ExternalIdentity, AppUser. | Busca identidad por Provider+Subject; si no existe, busca correo y lo vincula o crea AppUser como Viewer, luego crea ExternalIdentity. `UPDLOCK,HOLDLOCK`, transacción y `XACT_ABORT`; no comprueba invitación, alta administrativa ni permiso inicial. Riesgo de carrera/duplicidad de email debe probarse. Implementado, no probado. |
| `dbo.usp_User_ListForAdmin` | `@ActorUserId uniqueidentifier`; AppUser. | Exige actor activo Administrador, lista usuarios. Sólo lectura. Implementado, no probado. |
| `dbo.usp_Business_ListAuthorized` | `@UserId uniqueidentifier`; Business, AppUser, Permission. | Lista negocios activos si actor activo; Administrador global; Viewer con cualquier permiso activo del negocio. No es endpoint de métricas. Implementado, no probado. |
| `dbo.usp_Permission_ListForAdmin` | `@ActorUserId`, `@TargetUserId uniqueidentifier`; Business, SocialPlatform, Permission, AppUser. | Exige Administrador activo y Viewer activo; retorna matriz producto de negocios/plataformas activas con permiso efectivo. No registra consulta. Implementado, no probado. |
| `dbo.usp_Permission_SaveForViewer` | Actor/target UUID y `@Assignments nvarchar(max)`; Permission, Business, SocialPlatform, AppUser. | Comprueba actor Administrador, target Viewer activo, JSON válido, IDs existentes; aplica actualización e inserción dentro de transacción. Excepciones 51001-51004. La tabla temporal impone unicidad; no hay validación de al menos un permiso activo, de combinación duplicada con errores amigables ni tabla de auditoría. Implementado, no probado. |
| `dbo.usp_SocialAccount_ListAuthorized` | `@UserId uniqueidentifier`, `@BusinessId uniqueidentifier=NULL`, `@SocialPlatformId int=NULL`; SocialAccount, Business, SocialPlatform, AppUser, Permission. | Comprueba actor activo; filtros de comercio/plataforma son parámetros; Administrador global o permiso exacto por cuenta. Lista sólo cuentas conectadas y negocios activos. Manipulación de IDs debe terminar en conjunto vacío; falta test. Implementado, no probado. |
| `dbo.usp_SocialData_AuthorizationPredicate` | `@UserId`, `@BusinessId uniqueidentifier`, `@SocialPlatformId int`; AppUser, Permission. | Lanza 51006 si actor no activo o sin permiso exacto, Administrador global aceptado. Comentario indica reutilizarlo; no hay SP comerciales que lo invoquen. Es guardia preparatoria, no protege endpoints actuales de datos. Implementado como SP, no probado/consumido. |

Los scripts usan consultas SQL dentro de procedimientos, lo cual cumple el patrón de persistencia para esas operaciones. `initialize.js` sí usa `.query()` para crear base/login/usuario, conceder EXECUTE y `sqlServer.js` usa `SELECT 1` para salud. Son operaciones de inicialización/health, no repositorios de negocio, pero incumplen literalmente la regla “Node no ejecuta consultas directas” si se aplica sin excepción a DDL/health. `accessRoutes.js` y `googleAuthRoutes.js` llaman `.execute()` directamente; no hay operación relacional mediante DML ad hoc en esas rutas, pero el driver y la persistencia están en Presentation, incumpliendo límites de capas. Se recomienda mantener la excepción explícita de bootstrap/health fuera del acceso de negocio o trasladar bootstrap a un mecanismo versionado de despliegue.

## 7. Inventario de endpoints

Prefijo local del backend: `/auth` y `/access`; Nginx publica API bajo `/api`. No hay middleware global de manejo de errores en `main.js`; `accessRoutes` agrega uno propio y la ruta Google responde genéricamente.

| Método / ruta | Middleware / rol | Validación y SP | Estado real |
|---|---|---|---|
| GET `/auth/google` | Ninguno. | Config OAuth presente; genera state, nonce, PKCE y cookie temporal; redirige a Google. | Implementado; no se completó autenticación real. |
| GET `/auth/google/callback` | Ninguno. | Comprueba code/state/cookie, intercambia token, verifica ID token, audience, nonce, email verificado; llama `usp_Auth_GoogleUser`. | Implementado, no probado con identidad real; además registra automáticamente nuevos usuarios. |
| GET `/access/me` | `authenticate`. | Middleware valida HS256/exp, luego `usp_Auth_GetActiveUser`. | Implementado, no probado. |
| GET `/access/users` | `authenticate`, `requireAdministrator`. | `usp_User_ListForAdmin` vuelve a comprobar Administrador. | Implementado, no probado; sólo lista. |
| GET `/access/businesses` | `authenticate`. | `usp_Business_ListAuthorized`. | Implementado, no probado. |
| GET `/access/social-accounts` | `authenticate`. | Lee `businessId` y convierte `socialPlatformId`; `usp_SocialAccount_ListAuthorized` filtra permisos en SQL. No hay validación HTTP estricta para NaN/ID mal formado. | Implementado, no probado. |
| GET `/access/users/:userId/permissions` | `authenticate`, `requireAdministrator`. | `usp_Permission_ListForAdmin`; el SP valida actor/target. | Implementado, no probado. |
| PUT `/access/users/:userId/permissions` | `authenticate`, `requireAdministrator`. | Valida array, máximo 1000, UUID, entero y booleano; llama `usp_Permission_SaveForViewer`. | Implementado, no probado; la interfaz no impide revocar todos. |

No existen POST de usuario/invitación, reset, logout, refresh, sesiones, altas/activación, revocación global ni endpoints de métricas/publicaciones/reportes. Un endpoint autenticado verifica firma, expiración y usuario activo en DB; rol es releído de DB. El permiso comercial sólo se aplica en endpoints de negocios/cuentas, no hay endpoints comerciales para verificarlo. `requireAdministrator` comprueba `request.auth.Role`, obtenido de SQL por solicitud, no del token.

## 8. Autenticación

| Capacidad | Evaluación |
|---|---|
| Login correo/contraseña y verificación de password | NO IMPLEMENTADO; no hay columnas hash ni endpoint. |
| Emisión JWT | PARCIAL: JWT HS256 manual en callback Google, con `sub`, `iat`, `exp` de una hora. No hay `iss`, `aud`, `jti` ni librería JWT; no probado de extremo a extremo. |
| Validación JWT | Implementada en middleware con HMAC, comparación timing-safe, algoritmo permitido HS256, UUID y exp; luego consulta usuario activo en DB. No prueba de tokens inválidos/expirados ejecutada. |
| Logout / logout global | NO IMPLEMENTADO; el frontend sólo depende de sessionStorage. |
| Registro público | Existe de hecho por autoalta del callback; contradice decisión. |
| Manejo de errores | Callback devuelve error genérico en hash fragment; no hay telemetría sensible evidente. |

## 9. Estado de Google OAuth

Existe authorization code flow OIDC con scopes `openid email profile`, `state`, nonce, PKCE S256 y cookie HttpOnly, SameSite=Lax, de cinco minutos. Callback usa `google-auth-library` para intercambiar código y verificar firma/issuer/audience del ID token; valida `sub`, email verificado y nonce. No se observan secretos hardcodeados en código frontend/backend. El cliente lee secretos de variables de entorno. No se usó cuenta real ni se validó callback contra Google en esta auditoría.

La identidad guardada se identifica por proveedor y `sub`. Si no existe, el SP vincula por email coincidente o crea cuenta Viewer sin invitación. La vinculación por email verificado es una asociación implícita, no el proceso explícito de vinculación a una cuenta existente definido por el requerimiento. No hay flujo para Administrador/bootstrap. El JWT se redirige en el fragmento URL (`/#access_token=...`) y `frontend/src/main.jsx` lo copia a `sessionStorage`; el fragmento evita envío normal al servidor, pero expone el bearer token a JavaScript de la página y su superficie XSS.

## 10. JWT y sesiones

Sólo hay access token con duración de una hora. No existen refresh tokens, almacenamiento hash de refresh token, rotación, detección de reutilización, revocación por sesión ni tabla de sesiones. La desactivación tiene efecto en la siguiente solicitud porque el middleware consulta AppUser activa cada vez; no hay mecanismo de revocación anticipada de un access token manteniendo usuario activo.

El access token se guarda en `sessionStorage`, no en `localStorage`; esto cumple literalmente la prohibición de localStorage, pero sigue siendo accesible por cualquier script ejecutado en el origen. No hay cookie de sesión HttpOnly para el JWT.

## 11. Usuarios e invitaciones

La tabla AppUser almacena datos mínimos y rol único vía CHECK. No hay UI/backend reales para crear o editar usuarios; `UsersPage` inicia desde `initialUsers`, muta estado local y lo indica. El endpoint de usuarios sólo lista. “Invitar a alguien” no envía correo ni crea cuenta. Sin invitación, expiración, uso único, contraseña de activación, reenvío ni recuperación de contraseña. La política de registro sólo por Administrador se incumple por creación automática Google.

## 12. Permisos y autorización

El modelo de permiso tiene el trío acordado y los SP de lista de comercios/cuentas filtran en SQL. El administrador global aparece en los predicados. El middleware vuelve a leer actor activo y rol en cada solicitud. `usp_Permission_SaveForViewer` mantiene la asignación de forma que una revocación, al guardar, se refleja en consultas posteriores.

Limitaciones: se puede crear/obtener Viewer sin permiso; `usp_Auth_GoogleUser` crea Viewer sin ningún permiso; el SP de guardado acepta conjunto vacío; no hay historial de revocaciones ni datos de negocio seed. El endpoint de SocialAccount filtra `BusinessId` y `SocialPlatformId` en SQL, pero los escenarios de manipulación no se ejecutaron. `usp_SocialData_AuthorizationPredicate` no está consumido por ningún endpoint comercial.

### Escenarios requeridos

Ninguno se ejecutó contra SQL/API. No se afirma que pasaron. Procedimiento seguro pendiente: con base de prueba aislada y datos sintéticos, crear dos Viewers, dos negocios y plataformas; aplicar asignaciones; llamar endpoints con los dos tokens; variar IDs de comercio/plataforma; revocar y repetir con sesión/access token activo; verificar Administrador global; comprobar que cada Viewer no recibe filas/IDs de otro. Primero debe existir una vía controlada de bootstrap Admin y datos de fixture; no ejecutar esto sobre datos del usuario.

| Caso | Estado | Evidencia disponible |
|---|---|---|
| Viewer sin permisos | Pendiente | El modelo admite cero permisos y no hay endpoint comercial de datos. |
| Viewer con un comercio | Pendiente | SP filtra por existencia de permiso activo, no probado. |
| Viewer con varios comercios | Pendiente | Lógica SQL admite múltiples pares, no probado. |
| Facebook e Instagram en un comercio | Pendiente | Matriz por plataforma y comercio, no probado. |
| TikTok en otro comercio | Pendiente | Modelo relacional lo admite, no probado. |
| Manipulación de BusinessId | Pendiente | `usp_SocialAccount_ListAuthorized` filtra por parámetro y permiso; sin prueba HTTP/SQL. |
| Manipulación de SocialPlatformId | Pendiente | Filtro SQL y permiso exacto; coerción HTTP débil y sin prueba. |
| Revocación con sesión activa | Parcial por diseño | SP guarda estado y lista de cuentas reevalúa; no hay prueba. Access token no se revoca individualmente. |
| Administrador global | Pendiente | Predicados explícitos en SP; sin prueba. |
| Aislamiento de dos Viewers | Pendiente | No existe suite SQL/API ni datos/fixtures. |

## 13. Estado del frontend

- No hay pantalla de login de correo/contraseña, recuperación, invitación, activación, perfil real ni administración de sesiones. El acceso Google se presenta como link si no hay token.
- `App.jsx` acepta cualquier ruta sin token como modo `demo`, y monta vistas mock; con token Viewer reemplaza contenido por un aviso de que las métricas no están listas; Administrador ve módulos demo.
- `UsersPage.jsx` llama API para listado y matriz si existe token, pero usa datos iniciales/mutaciones locales para modo demo; alta, edición, activación y rol no persisten. La matriz sí consulta y envía asignaciones por comercio/plataforma para Viewer existente. No valida que al menos una casilla permanezca marcada.
- `sessionStorage` contiene access token; no hay refresh.
- `DashboardPage`, `ChannelPage`, `ComparisonPage`, `ReportsPage`, `AiPage`, `WhatsAppPage`, `ConnectionsPage`, además de partes de `UsersPage`, importan mocks o acciones locales. Ningún módulo de métricas consume API de datos protegidos.
- No se rediseñó ni modificó pantalla durante la auditoría.

## 14. Docker y Bootstrap

`docker-compose.yml` establece SQL Server como `AI_MARKETING_MANAGER` por defecto y obliga a inyectar credenciales/secretos requeridos desde entorno. El backend depende de SQL, Redis, MinIO y de la finalización exitosa de `database-init`/`minio-init`. SQL Server, Redis y MinIO no publican puertos host; redes `web` y `data` separadas; SQL healthcheck comprueba socket, no readiness de consulta.

`database-init` ejecuta `npm run init:database`, el cual conecta como `sa` desde infraestructura, crea DB/login/usuario idempotentemente, aplica `phase-2.sql` por lotes y concede `GRANT EXECUTE ON SCHEMA::dbo` a `app_user`. El runtime usa el login de aplicación. Esta concesión incluye todo SP actual/futuro en dbo, más amplia que una lista explícita de SP autorizados. No se halló creación/configuración de primer Administrador ni seed de negocios. El script sí es idempotente en la creación condicional de tablas y SP; el seed de plataformas sólo corre cuando la tabla completa está vacía.

La configuración de Compose contiene requerimientos de variables con interpolación; el informe no muestra valores. No se leyó `docs/client_secret_google.json` ni `.env`. El árbol incluye un JSON de cliente Google que la documentación dice excluido de Git; estado de seguimiento no verificable en este directorio porque no se pudo confirmar metadata de Git (el directorio de trabajo no presenta repositorio Git detectable en esta inspección). No se evaluó si el archivo contiene secreto ni se copió su contenido.

## 15. Pruebas y documentación

La única prueba encontrada es `frontend/e2e/phase-1.spec.js`; el manifiesto ofrece `npm run lint`, `npm run build` y `npm run test:e2e`. La suite trata Fase 1. No hay tests backend, unitarios, de integración SQL, OAuth, JWT, permisos ni escenarios de aislamiento.

`docs/validation.md` registra cierres de Fase 0 y 1.1 y una sección “Fase 2 — implementación parcial” del 2026-11-01: Compose, lint/build y sintaxis backend reportados exitosos entonces; Playwright no ejecutada y pruebas SQL pendientes. Estos son resultados históricos documentados, no resultados repetidos en esta auditoría. `docs/architecture.md`, `docs/database.md`, `docs/frontend.md` documentan el patrón y limitaciones, pero deben distinguir claramente código actual de futuras condiciones. Esta auditoría no ejecutó lint, build, Playwright, Compose ni SQL para mantener el alcance de solo lectura y evitar efectos laterales/despliegues.

## 16. Incumplimientos de reglas arquitectónicas

- **ALTO F2-ARQ-01:** `mssql` y `getPool()` se importan en `Presentation/Routes/accessRoutes.js` y `googleAuthRoutes.js`; queries `.execute()` ocurren en handlers. Deben residir en Infrastructure/Repositores y coordinarse desde Application.
- **MEDIO F2-ARQ-02:** `initialize.js` ejecuta SQL directo para DDL, login, usuario y GRANT; `sqlServer.js` ejecuta `SELECT 1` para health. No son persistencia de negocio, pero la regla literal no define excepción. Aclarar alcance y aislar esos comandos de la API.
- **MEDIO F2-ARQ-03:** Domain/Application vacías; faltan contratos, DTOs, casos de uso y validadores dedicados.
- **MEDIO F2-ARQ-04:** `GRANT EXECUTE ON SCHEMA::dbo` concede ejecución general del esquema en vez de SP autorizados individualmente.
- Cumplimientos estáticos parciales: no se encontró un motor relacional alternativo; el nombre de base predeterminado y el schema de objetos son `AI_MARKETING_MANAGER`/`dbo`; secretos de OAuth se obtienen por entorno y no se encontraron hardcodeados en frontend.

## 17. Riesgos de seguridad

- **CRÍTICO F2-SEC-01:** registro/autocreación pública de Viewer por Google en `usp_Auth_GoogleUser`, sin invitación/alta administrativa. Comportamiento real contradice política de acceso cerrada.
- **ALTO F2-SEC-02:** access token bearer en fragmento y `sessionStorage`; exposición potencial ante XSS y falta de estrategia de revocación.
- **ALTO F2-SEC-03:** no hay refresh rotatorio, hash, reutilización detectada ni revocación de sesiones.
- **ALTO F2-SEC-04:** Viewer se puede crear sin permiso; procedimiento permite guardar cero permisos. No existe regla de integridad que imponga al menos uno en alta/activación.
- **ALTO F2-SEC-05:** la superficie de autorización de datos comerciales no existe; el SP predicado no está conectado a una consulta de información. Las vistas de Administrador en modo demo aún muestran mocks, no datos autorizados.
- **MEDIO F2-SEC-06:** middleware valida un subconjunto de claims y HMAC propio; no valida `iat`, `iss`, `aud` o identificador de sesión. No hay prueba negativa de JWT.
- **MEDIO F2-SEC-07:** input `socialPlatformId` se convierte con `Number()` sin rechazo explícito de NaN/rango, y `businessId` no tiene validación UUID en ruta; el SP limita resultados, pero manejo de errores/contratos es inconsistente.
- **MEDIO F2-SEC-08:** GRANT de EXECUTE a todo schema y sin auditoría de acciones reduce granularidad de privilegio y trazabilidad.

## 18. Diferencias frente a decisiones acordadas

| Decisión | Estado observado | Diferencia |
|---|---|---|
| Sólo Administrador crea usuarios; registro público prohibido | Incumplido | Callback crea Viewer automáticamente. |
| Primer Admin por bootstrap protegido e idempotente | No implementado | No hay usuario inicial ni mecanismo seguro de bootstrap Admin. |
| Invitación, correo, expiración, uso único, reenvío | No implementado | No hay entidad, endpoint ni servicio de correo. |
| Usuario activa contraseña antes de login | No implementado | No existe password ni activación. |
| Un usuario, un rol | Parcial | Campo único Role y CHECK; Admin se puede asignar por SP/alta futura sin flujo controlado. |
| Viewer creado con >=1 permiso válido | Incumplido | Alta no existe; Google crea Viewer sin permisos; guardar vacío está permitido. |
| Permiso User+Business+Platform y Admin global | Parcial implementado | Restricciones/predicados existen, no hay pruebas ni endpoint comercial. |
| Revocación inmediata con sesión activa | Parcial | Se reevaluaría cada request de cuentas; sin prueba e historial, access JWT sigue vigente para usuario activo. |
| Google por sub y vinculación segura | Parcial | sub persistido y claims verificados; vínculo por email automático, sin proceso de consentimiento/autorización explícito. |
| Access JWT + refresh rotatorio hash + logout/revocación | No implementado | Sólo access JWT HS256 de una hora. |
| No tokens en localStorage | Cumplido literalmente, con riesgo | Se usa sessionStorage y fragmento URL. |

## 19. Funcionalidades faltantes

1. Bootstrap seguro, único e idempotente del primer Administrador.
2. Alta administrativa de usuarios y Viewer con permisos no vacíos en la misma operación transaccional.
3. Invitación por email, token de un solo uso con expiración, reenvío, activación y establecimiento de contraseña.
4. Password hash seguro, login local, reset de contraseña y token de recuperación.
5. Vinculación explícita de Google a cuenta provisionada; prohibir auto-registro y asociación automática no autorizada.
6. Sesiones/refresh token hash, rotación, reutilización detectada, logout por sesión y global.
7. Capas Domain/Application/Repository para las funciones existentes, y contratos/validación estructurados.
8. Auditoría persistente de cambios de usuarios, roles, invitaciones, conexiones, permisos y sesiones.
9. Endpoints mínimos de datos protegidos para poder verificar autorización (la consulta comercial completa permanece dentro del alcance de fase posterior; no implementada en esta auditoría).
10. Pruebas automatizadas backend/SQL/API con dos Viewers y Administrador, incluyendo manipulación y revocación.
11. Manejo explícito de errores, validación de IDs y estado de usuario, hardening de token/cookies.
12. Matriz UI real de alta con selección inicial obligatoria de permisos; perfil y gestión de sesiones.

## 20. Plan de corrección priorizado

1. **P0 — cerrar registro abierto:** quitar autoalta de Google; sólo resolver identidades vinculadas a usuarios provisionados/activados. Diseñar bootstrap Admin protegido y auditable antes de exponer autenticación.
2. **P0 — resolver permisos iniciales:** crear Viewer e insertar al menos un permiso válido como transacción indivisible; rechazar lista vacía en SP y API; impedir activación hasta cumplirlo.
3. **P1 — completar identidad/sesiones:** invitaciones, password/reset, vínculo Google seguro y sesiones con refresh hash rotatorio, revocación y detección de reutilización; retirar token de fragment/sessionStorage a un diseño de sesión seguro.
4. **P1 — separar capas:** mover acceso SQL y mssql exclusivamente a Infrastructure; repositories invocan `.execute()`, Application orquesta y Presentation valida protocolo HTTP. Mantener DDL/bootstrap aislado y documentar la excepción de health check.
5. **P1 — reducir privilegio y auditar:** reemplazar GRANT de schema por permisos de ejecución explícitos; agregar auditoría persistente para actos administrativos y permisos.
6. **P1 — integrar límites de autorización:** todos los endpoints de datos que se creen deben tomar UserId de identidad autenticada y aplicar BusinessId+SocialPlatformId dentro del SP; no aceptar autoridad del cliente.
7. **P1 — pruebas de aislamiento:** fixtures sintéticos, SQL/API de los diez escenarios requeridos, pruebas de tokens, revocación activa y callback OIDC controlado sin credenciales reales en CI.
8. **P2 — integrar frontend:** login, recuperación, invitación, alta Admin, validación de permisos, sesiones y tratamiento de errores; mantener pantallas comerciales cerradas hasta que consuman datos protegidos reales.
9. **P2 — alinear documentación:** etiquetar evidencia ejecutada vs diseño objetivo y conservar el reporte de pruebas fechado.

## 21. Matriz final de cumplimiento

| Requisito | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Node no ejecuta SQL directo | PARCIAL | Routes ejecutan SP; bootstrap/health usan `.query()`. | Aislar/documentar excepción y evitar SQL en API. |
| Persistencia relacional mediante SP | PARCIAL | DML de negocio actual se realiza dentro de SP; no hay repositorios. | Encapsular llamadas; revisar bootstrap/operaciones nuevas. |
| `mssql` sólo en Infrastructure | NO IMPLEMENTADO | Lo importan rutas Presentation. | Mover pool/driver a adaptadores y repositorios. |
| Repositorios usan `.execute()` | NO IMPLEMENTADO | No existen repositorios; routes llaman `.execute()`. | Implementar repositorios. |
| Sin SQL en Presentation/Application | PARCIAL | No hay SQL literal allí, pero Presentation accede al driver y ejecuta SP. | Eliminar acceso de persistencia de Presentation. |
| SQL Server único | IMPLEMENTADO SIN PRUEBAS | Compose y backend configuran SQL Server/mssql. | Confirmación de runtime no repetida. |
| Una base `AI_MARKETING_MANAGER` | IMPLEMENTADO SIN PRUEBAS | Default en conexión/bootstrap y Compose. | No se verificó instancia viva. |
| Schema inicial `dbo` | IMPLEMENTADO SIN PRUEBAS | Tablas/SP calificadas dbo. | No se verificó base desplegada. |
| Clean Architecture | PARCIAL | Carpetas existen; capas internas vacías y routes llaman Infrastructure. | Implementar capas y dependencias internas. |
| Autorización backend | PARCIAL | Middleware activo y SP filtran negocios/cuentas. | Pruebas; endpoints de datos; alta y permisos íntegros. |
| Secretos fuera de código/frontend | IMPLEMENTADO SIN PRUEBAS | OAuth lee env; Compose exige variables; no se detectó literal de secreto en fuentes inspeccionadas. | Revisar gestión/seguimiento del JSON sin revelar contenido. |
| Docker Compose como ejecución principal | IMPLEMENTADO SIN PRUEBAS | Servicios y bootstrap declarados en Compose. | Validación de Compose no repetida en auditoría. |
| Login correo/contraseña | NO IMPLEMENTADO | Sin hash, endpoint ni flujo UI. | Completar. |
| Google OAuth OIDC | IMPLEMENTADO SIN PRUEBAS | State, nonce, PKCE, verificación ID token y `sub` en callback. | No se probó con Google; cerrar provisión/vinculación segura. |
| Registro sólo por Administrador | NO IMPLEMENTADO | SP Google auto crea Viewer. | Eliminar autoalta; provisionar Admin/invitación. |
| Bootstrap primer Administrador | NO IMPLEMENTADO | No existe. | Crear bootstrap protegido/idempotente. |
| Invitación y activación de un uso/expirable | NO IMPLEMENTADO | Sin tabla, SP, rutas ni correo. | Completar flujo. |
| Recuperación por correo | NO IMPLEMENTADO | Sin modelo ni rutas. | Completar con token seguro de un uso. |
| Un rol por usuario | IMPLEMENTADO SIN PRUEBAS | Campo único y CHECK limitado a dos roles. | Forzar cambios sólo vía flujo Admin y testear. |
| Viewer con permiso inicial obligatorio | NO IMPLEMENTADO | Autoalta sin permisos; SP acepta conjunto vacío. | Validación API/SP transaccional. |
| Permisos por usuario/comercio/plataforma | IMPLEMENTADO SIN PRUEBAS | Tabla, UNIQUE, FKs y procedimientos. | Pruebas de combinaciones y revocación. |
| Admin acceso global | IMPLEMENTADO SIN PRUEBAS | Predicados SQL explícitos. | Prueba de integración. |
| Revocación inmediata por solicitud | IMPLEMENTADO SIN PRUEBAS | Se vuelve a leer usuario/permisos en DB en cada endpoint implementado. | Probar con token activo y completar endpoints de datos. |
| Access JWT | IMPLEMENTADO SIN PRUEBAS | Emisión manual HS256 y validación middleware. | Pruebas completas y endurecer claims/sesión. |
| Refresh rotatorio hash y reutilización | NO IMPLEMENTADO | Sin tablas ni endpoints. | Completar. |
| Logout / revocación de sesiones | NO IMPLEMENTADO | Sin endpoints ni registro de sesión. | Completar. |
| Token no en localStorage | IMPLEMENTADO SIN PRUEBAS | `sessionStorage` y fragmento. | Evitar exposición a scripts y documentar diseño seguro. |
| Endpoints de métricas/publicaciones/reportes | NO IMPLEMENTADO | No aparecen rutas/SP de datos comerciales. | Fase posterior; no confundir SP predicado con endpoint. |
| Pruebas de aislamiento requeridas | NO IMPLEMENTADO | No hay tests SQL/API Fase 2. | Crear suite con datos aislados sintéticos. |

## Resultado de la auditoría

**Revisado:** estructura y fuentes del backend/frontend; único script SQL localizado; rutas, middleware, configuración de DB, Compose/Dockerfiles, manifiestos de paquetes, documentación y pruebas presentes.  
**Verificaciones ejecutadas:** búsquedas estáticas de estructura y símbolos, lectura de implementación y comparación con decisiones/requisitos. No se imprimieron valores de secretos.  
**No comprobado:** estado de una base instalada, ejecución real del bootstrap, salud de servicios, pruebas SQL/API, build/lint, navegador, autenticación Google real, correo o presencia/tracking de archivos sensibles en Git.  
**Cambios realizados:** sólo se creó este informe; no se modificó código, SQL, Docker, configuración ni variables de entorno.

---

## Seguimiento posterior — implementación progresiva (2026-11-02)

Se conserva sin cambios el snapshot de auditoría anterior. Este apéndice registra correcciones posteriores observadas en el código; no equivale a verificación sobre una base desplegada.

| Hallazgo original | Estado posterior | Evidencia |
|---|---|---|
| F2-SEC-01 alta pública Google | Corregido en código | `usp_Auth_GoogleUser` ahora sólo consulta identidad `sub` existente y activa; `LoginWithGoogleIdentity` rechaza identidad no provisionada. Falta prueba SQL/OIDC. |
| F2-ARQ-01 SQL dentro de rutas | Corregido para rutas existentes | `SqlAuthRepository`/`SqlAccessRepository` encapsulan `.execute()`; Presentation llama Application o middleware inyectado. Verificación estática de imports. |
| Falta bootstrap Admin y login | Implementado y probado en SQL efímero | SP transaccional con application lock, hash Argon2id, job Compose separado con login SQL de inicialización, `DENY` al usuario runtime, y endpoint login con cookie HttpOnly. Se verificó sin tocar el volumen persistente. |
| Vista Users aparenta guardar acciones mock | Parcialmente corregido | Listado y permisos usan API/cookie; alta/edición/estado no persistidos se deshabilitaron. |
| Viewer sin permisos | Parcialmente corregido | UI y `usp_Permission_SaveForViewer` rechazan dejar cero asignaciones; creación de Viewer con permisos sigue pendiente. |
| Access token en sessionStorage/hash | Corregido para login/logout actual | Token nuevo se entrega en cookie HttpOnly; main no lee token de storage. Falta refresh/CSRF/sesiones. |
| Último Administrador desactivable | Corregido y probado en SQL efímero | `usp_User_SetActive` serializa cambios y rechaza la desactivación del único Admin; el endpoint devuelve HTTP 409. |

Las verificaciones del apéndice constan en `docs/validation.md` y `docs/FASE_2_IMPLEMENTACION.md`. Invitaciones, recuperación, refresh, administración completa de usuarios y pruebas de aislamiento permanecen pendientes.
