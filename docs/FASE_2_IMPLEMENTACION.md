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
