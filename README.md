# AI Marketing Manager

Base contenerizada para una plataforma de análisis multicanal. Fase 0 proporciona la infraestructura; Fase 1 añade una interfaz navegable de demostración; Fase 2 está en implementación parcial con acceso de Administrador, login y permisos básicos. No hay integraciones comerciales reales.

## Requisitos

- Docker Desktop con Docker Compose v2.
- En Mac Apple Silicon, Docker Desktop debe permitir emulación `linux/amd64` para SQL Server. Microsoft no soporta ni prueba SQL Server Linux sobre ARM64 ni emulación. Consulta [docs/deployment.md](docs/deployment.md).
- Al menos 4 GB de memoria disponibles para SQL Server (8 GB recomendados para el entorno completo).

## Configuración y arranque

```bash
cp .env.example .env
```

Completa `.env` con contraseñas de desarrollo fuertes para `SQLSERVER_SA_PASSWORD`, `SQLSERVER_PASSWORD`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` y `AUTH_JWT_SECRET` (mínimo 32 caracteres aleatorios). Define también `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (mínimo 12 caracteres) y `BOOTSTRAP_ADMIN_NAME`; no hay credenciales predeterminadas. Google OAuth es opcional y requiere `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`. No compartas ni versionés `.env` o `docs/client_secret_google.json`.

```bash
docker compose up -d --build
```

La primera inicialización puede tardar varios minutos, especialmente en Apple Silicon. Nginx espera en `http://localhost:${APP_PORT:-80}`, sirve la aplicación y enruta `/api/*` al backend. En desarrollo usa Vite; producción sirve el build estático con fallback para las rutas de React.

Las imágenes oficiales de MinIO no están disponibles en los registros públicos consultados. Compose fija por digest una imagen endurecida de Chainguard que contiene el servidor MinIO, incluida para ARM64.

## Verificación

```bash
docker compose ps
curl -i http://localhost/                         # pantalla React
curl -i http://localhost/api/health               # salud del proceso API
curl -i http://localhost/api/health/ready         # SQL Server, Redis y MinIO/bucket
docker compose logs -f backend sqlserver redis minio nginx
```

`/api/health/ready` devuelve HTTP 503 y el estado de cada dependencia cuando alguna no está lista. MinIO crea automáticamente el bucket `ai-marketing-manager`.

## Interfaz de demostración — Fase 1

Al abrir `http://localhost/` encontrarás el Dashboard y la navegación a Facebook, Instagram, TikTok, comparación, reportes, Inteligencia Artificial, WhatsApp, conexiones, usuarios y ajustes. El período global actualiza los datos simulados, incluido el rango personalizado. En escritorio se puede colapsar la barra lateral; en móvil se abre como menú.

El Administrador ingresa con las variables de bootstrap; usuarios y matriz de permisos tienen API básica. Las métricas, publicaciones, conversaciones y conexiones siguen siendo locales y simuladas. No se conecta a Meta, TikTok, OpenAI ni WhatsApp. Consulta [docs/bootstrap-admin.md](docs/bootstrap-admin.md) para configurar el acceso y [docs/FASE_2_IMPLEMENTACION.md](docs/FASE_2_IMPLEMENTACION.md) para los pendientes.

## Detener y producción

```bash
docker compose stop
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`down` conserva los volúmenes. No uses `docker compose down -v` como operación normal. Producción requiere variables protegidas, un host x86-64 soportado para SQL Server, certificado SQL válido, dominio y certificados TLS en el proxy antes de exponer el servicio. La configuración HTTPS futura se documenta en `docs/deployment.md`.

## Estructura

- `frontend/`: React y Vite; build estático servido con Nginx en el perfil de producción.
- `frontend/src/modules/`: vistas independientes para cada sección de Fase 1.
- `backend/src/`: capas Domain, Application, Infrastructure y Presentation. Solo se implementan adaptadores de conectividad y controles de salud.
- `database/`: inicialización idempotente de la base vacía.
- `infrastructure/nginx/`: proxy HTTP y plantilla preparada para TLS futuro.
- `docs/`: arquitectura, datos y operación.

Los resultados de infraestructura están en [docs/validation.md](docs/validation.md).

La configuración del primer Administrador se explica en [docs/bootstrap-admin.md](docs/bootstrap-admin.md). El despliegue requiere definir sus variables protegidas antes de iniciar Compose.

No se han creado tablas ni Stored Procedures de negocio. El plan completo permanece en [AI_Marketing_Manager_Plan_Maestro_v3.md](AI_Marketing_Manager_Plan_Maestro_v3.md).
