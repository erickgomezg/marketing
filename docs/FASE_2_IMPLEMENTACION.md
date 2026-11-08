# Implementación progresiva de Fase 2

**Actualizado:** 2026-11-02  
**Estado global:** PARCIAL. Bloques 1 y 2 implementados y verificados en entorno sintético; Bloque 3 parcialmente conectado. Bloques 4–8 pendientes en su mayoría. No desplegado contra la instancia persistente del proyecto.

## Estado por bloque

| Bloque | Estado | Entrega / pendientes |
|---|---|---|
| 1. Administrador y acceso inicial | IMPLEMENTADO Y PROBADO EN SQL EFÍMERO | Bootstrap protegido/idempotente, Argon2id, login correo/contraseña, perfil y cookie HttpOnly. Requiere configurar variables localmente. Prueba sintética validó creación, no sobrescritura, credencial correcta/incorrecta y perfil. |
| 2. Arquitectura | IMPLEMENTADO PARA FLUJOS ACTUALES | `mssql` y repositorios viven en Infrastructure; rutas llaman Application; composition root inyecta dependencias. Aún hay que seguir usando estas capas al desarrollar las funcionalidades que faltan. |
| 3. Usuarios y permisos | PARCIAL | Listado, matriz persistida, rechazo de cero permisos y activación/desactivación real. Un SP serializa cambios y protege al último Administrador activo; se probó en SQL efímero. Crear/invitar, editar perfil y cambios de rol siguen pendientes. |
| 4. Google, invitaciones y recuperación | PARCIAL | Se eliminó auto-registro Google; sólo permite identidad Google previamente vinculada por `sub`. Invitaciones/correos/activación/reset/vinculación explícita aún no existen. |
| 5. Sesiones y JWT | PARCIAL | Access JWT HS256 configurable (15 min por defecto) en cookie HttpOnly; logout limpia cookie y cada request vuelve a verificar usuario activo/rol en SQL. Refresh token, rotación, reutilización y revocación por sesión/global pendientes. |
| 6. Autorización y aislamiento | PARCIAL | SP ya filtran comercios/cuentas y Administrador es global. No hay endpoints comerciales ni pruebas de los diez escenarios. |
| 7. Frontend | PARCIAL | Login, carga de perfil, logout y navegación según rol. Administrador conserva dashboard y módulos demo; Viewer no recibe vistas comerciales con mocks. Alta/recuperación/invitación/sesiones pendientes. |
| 8. Pruebas y documentación | PARCIAL | Build frontend, lint, sintaxis backend, cuatro pruebas unitarias de login, build backend y validación de ambos Compose con valores dummy. Sin Playwright, integración SQL, OAuth real ni pruebas de aislamiento. |

## Funcionalidades implementadas

- `POST /auth/login` (publicado vía proxy como `/api/auth/login`): busca por correo mediante SP, verifica Argon2id, rechaza usuario inactivo/credenciales incorrectas con respuesta genérica, emite cookie HttpOnly y retorna perfil/rol desde DB.
- `POST /auth/logout`: elimina la cookie local. No revoca refresh/sesiones porque todavía no existen.
- `GET /access/me`: comprueba cookie/JWT y vuelve a leer el usuario activo desde DB.
- Google OIDC mantiene state, nonce y PKCE; consulta una identidad previamente vinculada por `sub`. El flujo ya no crea usuarios ni vincula automáticamente por correo.
- `/access/users`, `/access/businesses`, `/access/social-accounts` y rutas de matriz mantienen autorización SQL, ahora detrás de repositorios.
- Bootstrap del primer Administrador con application lock transaccional; no actualiza ni duplica una cuenta si ya existe Administrador y no eleva un usuario preexistente por coincidencia de email.
- Tabla de Usuarios usa el API real; altas, edición y activación se muestran deshabilitadas hasta persistirse.

## Tablas y Stored Procedures

Cambio aditivo de tabla: `dbo.AppUser.PasswordHash nvarchar(255) NULL`, añadida si falta. No se borran ni transforman datos existentes.

SP nuevos/modificados en `backend/src/Infrastructure/Database/StoredProcedures/phase-2.sql`:

- Nuevo `dbo.usp_Auth_FindByEmail`: obtiene credencial por email para el caso de uso de login.
- Nuevo `dbo.usp_Auth_BootstrapAdministrator`: transacción con `sp_getapplock`, creación sólo cuando no existe ningún Administrador; no reemplaza hash.
- Modificado `dbo.usp_Auth_GoogleUser`: ahora sólo busca identidad existente por `Provider='Google'` y `ExternalSubject`; dejó de crear/vincular usuarios.
- Modificado `dbo.usp_Permission_SaveForViewer`: rechaza matriz sin permisos activos.
- Nuevo `dbo.usp_User_SetActive`: actualiza estado con comprobación de rol Admin y protege al último Administrador activo mediante application lock.

Se mantienen una base `AI_MARKETING_MANAGER` y esquema `dbo`. Inicialización sigue idempotente y aditiva.

## Endpoints

Todas las rutas se montan en el backend bajo `/auth` y `/access`; Nginx las expone bajo `/api`.

| Método / ruta pública | Protección | Estado |
|---|---|---|
| POST `/api/auth/login` | Credenciales en cuerpo; cookie HttpOnly de respuesta | Implementado y verificado en SQL efímero. |
| POST `/api/auth/logout` | Limpia cookie local | Implementado; no existe revocación de refresh/sesión persistida. |
| GET `/api/auth/google` | State/nonce/PKCE | Implementado; proveedor requiere identidad ya vinculada. No probado contra Google. |
| GET `/api/auth/google/callback` | State/nonce, ID token OIDC | Implementado; lookup por `sub`, sin autocrear. No probado contra Google. |
| GET `/api/access/me` | Cookie JWT y usuario activo leído de DB | Implementado y verificado en integración aislada. |
| GET `/api/access/users` | Administrador | Implementado vía `usp_User_ListForAdmin`; listado probado en SQL efímero. |
| PUT `/api/access/users/:userId/active` | Administrador | Implementado vía `usp_User_SetActive`; desactivación del último Administrador rechazada con HTTP 409 en SQL efímero. |
| GET `/api/access/businesses` | Usuario autenticado | Implementado vía `usp_Business_ListAuthorized`; no probado con fixture Viewer. |
| GET `/api/access/social-accounts` | Usuario autenticado, filtros en SP | Implementado vía `usp_SocialAccount_ListAuthorized`; escenarios de manipulación pendientes. |
| GET `/api/access/users/:userId/permissions` | Administrador | Implementado vía `usp_Permission_ListForAdmin`; sin prueba de integración. |
| PUT `/api/access/users/:userId/permissions` | Administrador | Implementado vía `usp_Permission_SaveForViewer`; cero permisos rechazados por API y SP, sin prueba SQL de integración. |

No existen endpoints comerciales de métricas/publicaciones/reportes, altas/invitaciones, cambios de rol/estado, recuperación, refresh ni sesiones.

## Archivos modificados/creados

- Backend: `package.json`, `package-lock.json`, `src/main.js`, `src/Infrastructure/Database/StoredProcedures/phase-2.sql`, `src/Infrastructure/Repositories/SqlAuthRepository.js`, `SqlAccessRepository.js`, `src/Infrastructure/Security/Argon2PasswordHasher.js`, `AccessTokenService.js`, `src/Infrastructure/Providers/GoogleOAuthProvider.js`, `src/Infrastructure/Bootstrap/bootstrapAdmin.js`, `src/Domain/Entities/User.js`, `src/Domain/Interfaces/AuthRepository.js`, `src/Application/UseCases/LoginWithPassword.js`, `LoginWithGoogleIdentity.js`, `src/Application/Services/AccessService.js`, `src/Presentation/Controllers/AuthController.js`, `src/Presentation/Middlewares/authenticate.js`, `src/Presentation/Routes/accessRoutes.js`, `googleAuthRoutes.js`, `test/login.test.js`.
- Frontend: `src/main.jsx`, `src/app/App.jsx`, `src/components/layout/AppShell.jsx`, `Header.jsx`, `Sidebar.jsx`, `src/modules/users/UsersPage.jsx`, `src/styles/global.css`, `e2e/auth-phase2.spec.js`.
- Infra/config/docs: `docker-compose.yml`, `.env.example`, `README.md`, `docs/architecture.md`, `docs/database.md`, `docs/bootstrap-admin.md`, `docs/FASE_2_AUDITORIA_TECNICA.md`, `docs/validation.md`.

## Configuración y ejecución local

1. Define las variables en el `.env` local no versionado: `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (mínimo 12 caracteres), `BOOTSTRAP_ADMIN_NAME`, además de los secretos y variables ya requeridos por el stack.
2. Inicia con `docker compose up -d --build`.
3. Ingresa en `http://localhost/` con el correo y contraseña que configuraste.

Nunca hay credenciales por defecto. La guía completa, incluida configuración de producción mediante un gestor de secretos, está en [docs/bootstrap-admin.md](bootstrap-admin.md). La cuenta existente no se modifica al repetir Compose; no hay recuperación de contraseña implementada aún.

## Verificaciones ejecutadas

| Verificación | Resultado |
|---|---|
| `docker compose config -q` con valores dummy de validación | EXITOSA |
| Compose desarrollo + producción `config -q` con valores dummy | EXITOSA |
| Build Docker backend con Argon2id | EXITOSA |
| Smoke test de proceso API y `/health` en contenedor temporal | EXITOSA: HTTP 200; sin conexión SQL |
| Bootstrap sin configuración | EXITOSA (fallo seguro esperado): termina antes de conectar a SQL |
| Inicialización SQL + bootstrap repetido + login HTTP | EXITOSA en SQL efímero; 1 Admin tras repetir bootstrap; password alterna rechazada; cookie HttpOnly y `/access/me` válidos |
| Protección del último Administrador | EXITOSA en SQL efímero; SP rechazó desactivación y `/access/me` confirmó que seguía activo |
| Build Docker frontend (Vite) | EXITOSA |
| ESLint frontend | EXITOSA |
| `node --check` para archivos backend actuales | EXITOSA |
| Pruebas unitarias de login, Argon2id y Google provisionado | EXITOSA: 6 pasaron, 0 fallaron |
| Playwright flujo login correcto/incorrecto | EXITOSA: 2 pasaron con API interceptada; no valida backend ni SQL |
| Suite E2E completa histórica de Fase 1 | NO EJECUTADA |
| Bootstrap, Stored Procedures y login contra SQL Server | NO EJECUTADOS |
| Pruebas SQL de permisos y aislamiento | NO EJECUTADAS |
| Google OAuth real y envío de correo | NO EJECUTADOS |

Los valores dummy sólo sirvieron para validar sintaxis de Compose y no se guardaron. No se mostró ni leyó ningún secreto de `.env`.

## Pendientes y riesgos

- No se ha creado Administrador en el volumen persistente del proyecto; la integración se hizo en un SQL Server desechable. Para uso local real, configura variables protegidas y ejecuta Compose.
- El login carece de throttling/lockout ante intentos repetidos.
- Sólo hay access JWT. No existe refresh token rotatorio, tabla de sesiones, logout global ni detección de reutilización.
- Google autentica identidades vinculadas previamente; todavía no hay interfaz/procedimiento de vinculación explícita ni invitaciones.
- Faltan alta/invitación y edición real de usuarios, cambios de rol, activación de cuenta invitada, recuperación y correo/outbox. La desactivación persistente sí existe y bloquea al último Administrador.
- No están implementados los diez escenarios de aislamiento ni APIs de métricas/publicaciones/reportes. No se implementó Fase 3.
- Administrador ve los módulos comerciales con datos mock, señalados como demostración; aún no son datos autorizados de negocio.
- `GRANT EXECUTE ON SCHEMA::dbo` sigue siendo amplio; falta reducirlo a permisos explícitos por SP.
- Cookie SameSite=Lax reduce exposición CSRF cross-site, pero aún falta una política CSRF explícita para mutaciones.

## Problemas encontrados durante la implementación

- No había Node/npm instalados en el host. Se usaron imágenes Docker Node para instalación, build y ejecución de checks.
- El lint detectó una función sin uso al retirar las acciones de perfil demo; se eliminó y el lint final pasó.
- No se inició el Compose del proyecto ni se ejecutaron cambios sobre su SQL persistente. Se levantó un SQL Server desechable aislado para ejecutar la inicialización, el bootstrap y los flujos básicos de login.


## Actualización de seguridad en rama dev

En el primer bloque de endurecimiento de seguridad se realizaron estos cambios:

- Se retiró el permiso general `GRANT EXECUTE ON SCHEMA::dbo` para `app_user`.
- El inicializador revoca el permiso general heredado de ese esquema y concede `EXECUTE` de forma explícita sobre los procedimientos que invoca la API.
- `usp_Auth_BootstrapAdministrator` permanece denegado para `app_user`; el bootstrap se ejecuta desde el servicio de inicialización aislado con la cuenta administrativa.
- Se agregó validación de encabezado `Origin` para mutaciones autenticadas mediante cookie. Las solicitudes `GET`, `HEAD` y `OPTIONS` no se bloquean; clientes que usan exclusivamente Bearer token no dependen de cookies del navegador.
- Se agregó limitación de solicitudes por IP para login, recuperación de contraseña, validación/aceptación de invitaciones y restablecimiento de contraseña.
- Se configuró Express para confiar en el salto del proxy Nginx de Compose. `TRUST_PROXY_HOPS` permite ajustar esa cantidad y `APP_ALLOWED_ORIGINS` permite agregar orígenes exactos separados por coma.

### Alcance y limitaciones conocidas

El limitador actual mantiene contadores en memoria del proceso Node.js. Es adecuado como primera protección para la instancia única contemplada por el Compose actual, pero no coordina límites entre múltiples réplicas y se reinicia al reiniciar el backend. Antes de escalar horizontalmente debe sustituirse por un limitador distribuido respaldado por Redis. La limitación por IP tampoco reemplaza controles adicionales por cuenta ni monitoreo de abuso.

La protección CSRF compara el origen exacto de las solicitudes mutables autenticadas mediante cookie. En despliegue, `APP_PUBLIC_URL` debe coincidir con el origen público real y `APP_ALLOWED_ORIGINS` debe contener sólo orígenes adicionales confiables. La terminación HTTPS y los encabezados del proxy deben configurarse correctamente.

### Pruebas agregadas

Se añadieron pruebas unitarias para:

- Aceptar el origen configurado y rechazar orígenes cruzados o ausentes en mutaciones autenticadas por cookie.
- Permitir métodos seguros y clientes que no utilizan cookie.
- Aplicar límites por IP, devolver HTTP 429 y mantener contadores independientes.

Estas pruebas deben ejecutarse con `npm test` dentro de `backend`. La integración con SQL Server y la verificación efectiva de permisos se mantienen pendientes de un SQL Server de pruebas desechable; no deben ejecutarse contra la base persistente de producción.


## Bloque 2 — sesiones persistentes y renovación

- Se añadieron `dbo.AuthSession` y `dbo.AuthSessionTokenHistory`. Sólo se almacenan hashes SHA-256 de Refresh Tokens.
- `dbo.usp_Auth_Session` centraliza creación, rotación, revocación individual y revocación global por usuario.
- El JWT contiene el identificador de sesión (`sid`). Cada solicitud autenticada comprueba en SQL Server que el usuario y la sesión siguen activos, además de validar `AuthVersion`.
- Login local y Google crean una sesión persistente. Google sigue requiriendo una identidad previamente vinculada.
- `POST /auth/refresh` rota el Refresh Token y emite un Access Token nuevo. `POST /auth/logout` revoca la sesión actual.
- El Refresh Token viaja sólo en cookie HttpOnly, Secure en producción, SameSite=Lax y limitada a `/api/auth`; no se devuelve en el JSON.
- `AUTH_REFRESH_TOKEN_DAYS` configura la duración (1–30 días; predeterminado 7). El Access Token conserva 10–15 minutos.

### Detección de reutilización

Cada token rotado se guarda en el historial. Si se vuelve a presentar, el procedimiento revoca la sesión y registra el evento. La revocación global por usuario está disponible para flujos administrativos.

### Pendientes de integración

Los procedimientos de cambio de contraseña, desactivación y cambio de rol incrementan `AuthVersion` y revocan las sesiones persistidas del usuario. Esto invalida tanto Access Tokens como Refresh Tokens. La ejecución de SQL Server real queda pendiente; la suite unitaria de backend sí fue ejecutada correctamente en GitHub Actions.
