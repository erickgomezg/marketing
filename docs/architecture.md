# Arquitectura de Fase 0

## Servicios

Compose levanta Nginx, frontend, backend, SQL Server, Redis y MinIO, además de inicializadores de una sola ejecución: `database-init` prepara la base y login de aplicación, `admin-bootstrap` crea el primer Administrador si falta y `minio-init` crea el bucket idempotentemente. Las imágenes oficiales de MinIO no están disponibles en los registros públicos consultados; el servicio usa una imagen endurecida de Chainguard, fijada por digest, que incluye el servidor MinIO.

- **Nginx:** única entrada HTTP publicada; enruta `/api/` al backend y `/` al frontend.
- **Frontend:** React/Vite en desarrollo; imagen estática Nginx en producción.
- **Backend:** Express expone controles de salud y conecta a los tres servicios mediante adaptadores separados.
- **SQL Server:** única base relacional, con volumen persistente.
- **Redis:** servicio de cache independiente, con AOF y volumen.
- **MinIO:** almacenamiento de objetos con volumen y bucket inicial.

## Redes y comunicación

La red `web` conecta Nginx con frontend y backend. La red `data` es interna y conecta backend e inicializadores con SQL Server, Redis y MinIO; no publica puertos de datos al host. Nginx es la única puerta de entrada. Las dependencias de arranque esperan healthchecks o la finalización correcta de inicializadores.

## Clean Architecture

`backend/src/Domain`, `Application`, `Infrastructure` y `Presentation` organizan las capas del plan maestro. Las rutas llaman casos de uso/servicios; repositorios y adaptadores de SQL Server están en Infrastructure y ejecutan SP con `.execute()`. `main.js` actúa como composition root. El inicializador de base conserva comandos administrativos DDL/GRANT mediante el pool de Infrastructure.

## Autenticación y autorización (Fase 2)

El inicio Google usa `/auth/google` y `/auth/google/callback` con OpenID Connect authorization code, estado anti-CSRF, nonce y PKCE. El ID token se valida en servidor con `google-auth-library`; la identidad persistente se busca por Google `sub` y sólo se autentica una cuenta ya vinculada y activa. No se crean usuarios ni se vinculan identidades automáticamente. El login por contraseña valida el hash Argon2id y emite una cookie HttpOnly; el primer Administrador se configura con el bootstrap descrito en [bootstrap-admin.md](bootstrap-admin.md).

Las rutas `/access/*` requieren cookie `amm_access` (HttpOnly, SameSite=Lax; Secure en producción). El access JWT HS256 dura 15 minutos por defecto y su `sub` sólo sirve para recuperar `AppUser` activa mediante `usp_Auth_GetActiveUser`; rol y permisos se vuelven a leer de SQL. `AUTH_JWT_SECRET` debe tener al menos 32 caracteres. El refresh token rotatorio aún está pendiente.

La lista de comercios y cuentas sociales sale de Stored Procedures que autorizan dentro de SQL. Endpoints de permisos solo admiten Administrador y la modificación llama a un procedimiento que comprueba de nuevo el rol. Cualquier endpoint nuevo de datos deberá incluir el usuario autenticado y los IDs solicitados en su Stored Procedure; una ruta de datos no debe responder usando únicamente el filtro del cliente.

El frontend de Fase 1 aún renderiza métricas y usuarios mock. Estos mocks no representan datos autorizados ni se deben habilitar a Viewers en una integración real. Las APIs de Fase 2 establecen el límite backend; reemplazar las fuentes mock por estas APIs y conectar el proveedor de identidad es requisito previo a producción con datos de usuarios.

`database-init` usa `sa` para preparar la base y el login de aplicación. El job aislado `admin-bootstrap` usa `sa` sólo durante inicialización; la API se conecta como `app_user`, con `EXECUTE` general actual y `DENY` explícito sobre el SP del primer Administrador. El backend runtime nunca recibe la contraseña `sa`.

## Salud y cierre

`GET /health` confirma el proceso API. `GET /health/ready` abre/verifica el pool SQL, ejecuta `PING` en Redis y confirma que el bucket existe en MinIO. Devuelve HTTP 503 si cualquier dependencia falla. SIGTERM/SIGINT cierran el servidor y las conexiones de Redis/SQL.
