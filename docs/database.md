# SQL Server y datos

La base inicial es `AI_MARKETING_MANAGER`, sobre Microsoft SQL Server 2022 Developer en desarrollo. El volumen `sqlserver_data` persiste los archivos en `/var/opt/mssql`. `database-init` crea de manera idempotente la base, login y usuario `app_user`, aplica `backend/src/Infrastructure/Database/StoredProcedures/phase-2.sql` y concede `EXECUTE` sobre `dbo`. El backend nunca usa `sa`.

## Fase 2: aislamiento por comercio y plataforma

`Business`, `SocialPlatform`, `SocialAccount`, `ExternalConnection`, `AppUser` y `UserBusinessPlatformPermission` son el modelo persistente. La conexión de origen no se duplica al descubrir páginas y perfiles: múltiples `SocialAccount` pueden compartir `ExternalConnectionId`; los perfiles conservan su comercio y plataforma. La unicidad de permiso es `(UserId, BusinessId, SocialPlatformId)`. Un registro revocado se conserva con `IsActive=0` para auditoría y se reactiva al reasignar.

`usp_Business_ListAuthorized` y `usp_SocialAccount_ListAuthorized` aplican el rol y el permiso en SQL. `usp_Permission_SaveForViewer` reemplaza el estado activo de las asignaciones en una transacción y permite revocación inmediata. Para cada nueva consulta de métricas, publicaciones o reportes, el procedimiento debe recibir `@UserId`, `@BusinessId` y `@SocialPlatformId` y aplicar la misma condición de `usp_SocialData_AuthorizationPredicate` en el `WHERE`; nunca se deben cargar todas las filas para filtrarlas después. El acceso OAuth del proveedor queda representado por `ExternalConnection` y es independiente de permisos internos.

El bootstrap es idempotente y agrega las tablas y procedimientos faltantes; los registros de negocio previos se preservan. En instalaciones ya inicializadas se puede ejecutar `npm run init:database` para aplicar esta versión del esquema.

El login de aplicación queda sin permisos de lectura/escritura genéricos. El bootstrap de Administrador corre en un job aislado de inicialización; crea la cuenta sólo si aún no existe ningún Administrador.

La columna nullable `AppUser.PasswordHash` se agrega de forma aditiva a bases existentes. El hash Argon2id se calcula en Node y se persiste mediante `usp_Auth_BootstrapAdministrator`; no se envía contraseña en claro a SQL. El procedimiento obtiene un application lock exclusivo dentro de una transacción para evitar dos bootstraps concurrentes. `app_user` tiene `DENY EXECUTE` en este SP; sólo el job aislado con acceso de inicialización lo invoca. La tabla y registros preexistentes no se eliminan.

Las operaciones relacionales de negocio siempre se implementarán como SP versionados en `backend/src/Infrastructure/Database/StoredProcedures/`, con parámetros tipados y permisos mínimos.

## Backups y restauración

El volumen protege frente a recrear contenedores, pero no sustituye backups. En despliegue real, programa backups completos y de log hacia almacenamiento separado del host, cifra y controla el acceso. Prueba restauraciones periódicamente. Un respaldo del volumen requiere una parada consistente o herramientas de backup SQL Server; no copies archivos `.mdf` activos como estrategia de respaldo.

Para restaurar, recupera el backup con SQL Server (`RESTORE DATABASE`) en una instancia compatible y valida la base antes de reanudar la API. `docker compose down` conserva los volúmenes; `down -v` los elimina.

## Compatibilidad de CPU

La imagen oficial de SQL Server Linux solo está soportada en hosts Linux x86-64 Intel/AMD. Microsoft declara que la emulación/traducción (QEMU, Rosetta, Prism) no está probada ni soportada. Compose fija `platform: linux/amd64` para intentar su ejecución en el Mac M3 mediante emulación de Docker Desktop; eso no convierte la combinación en soportada. Cabe esperar arranque y consultas más lentos, mayor consumo de CPU y posibles fallos. Producción debe usar Linux x86-64 soportado o un servicio SQL Server administrado. El resultado real del intento local se reporta tras ejecutar Compose.
