# Despliegue

## Desarrollo

1. Instala Docker Desktop y habilita la emulación x86-64 si el host es Apple Silicon.
2. Copia `.env.example` a `.env` y configura contraseñas únicas y fuertes. `.env` está excluido de Git.
3. Ejecuta `docker compose up -d --build`.
4. Revisa `docker compose ps`, `docker compose logs -f` y los endpoints `/api/health` y `/api/health/ready`.
5. Para detener conserva datos con `docker compose down` o `docker compose stop`.

La única publicación de puerto de la base es Nginx (`APP_PORT`, por defecto 80). SQL Server, Redis, MinIO y la API solo tienen puertos internos en redes Docker. La consola MinIO (9001) tampoco se publica. Las imágenes oficiales MinIO de Docker Hub y Quay no estuvieron disponibles durante la verificación; Compose fija una imagen endurecida de Chainguard que contiene el servidor MinIO. Revisa las políticas de soporte y distribución de esa imagen para el despliegue destino.

## Producción

Ejecuta `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` con secretos inyectados por el entorno de despliegue o un gestor de secretos. Define `NODE_ENV=production`, contraseñas robustas, `MSSQL_PID` de acuerdo con la licencia y conserva los volúmenes persistentes. El override sirve el build estático de React y minimiza exposición de puertos.

Antes de tráfico real, usa un host x86-64 compatible, configura certificados válidos para TLS de Nginx y para cifrado SQL, monta certificados privados desde un gestor seguro, restringe firewall y prepara backups externos. `default.prod.conf.template` contiene el proxy HTTP y el punto de preparación para TLS futuro; no habilita HTTPS por sí solo.

## Variables, redes y salud

Las variables requeridas están en `.env.example`. No introduzcas secretos en el repositorio o en imágenes. `web` une Nginx con las aplicaciones; `data` es interna para SQL Server, Redis, MinIO e inicializadores. Healthchecks comprueban API, frontend/proxy, SQL Server y Redis; `GET /api/health/ready` verifica además SQL Server, Redis, MinIO y el bucket. MinIO expone su endpoint de salud `GET /minio/health/live`; el cliente de inicialización espera a que el servicio acepte operaciones.

## Apple Silicon M3

La imagen Linux oficial de SQL Server requiere x86-64. `platform: linux/amd64` solicita emulación en Docker Desktop con Apple Silicon; Microsoft no soporta ni prueba esta configuración. El rendimiento de base de datos puede degradarse de forma marcada y el uso de memoria/CPU crecer. La prueba local debe considerarse exploratoria; usa x86-64 para desarrollo reproducible y producción.
