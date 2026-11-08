# Avance de Fase 2 — bootstrap y login

Fecha: 2026-11-02. Verificación local de build/lint/sintaxis/unit tests, sintaxis Compose y una integración en SQL Server efímero. No se inició el Compose del proyecto ni se tocó su volumen persistente.

| Verificación | Resultado | Evidencia |
|---|---|---|
| Backend Docker build con Argon2id | EXITOSA | `docker build`; `npm ci --omit=dev` instaló dependencia y generó imagen. |
| API arranca y `GET /health` responde | EXITOSA | Contenedor temporal con variables dummy; HTTP 200. No conectó SQL ni ejecutó bootstrap. |
| Playwright de login correcto/incorrecto | EXITOSA (API simulada) | 2 pruebas contra build estático temporal; rutas API interceptadas por Playwright, sin afirmar validación de backend/SQL. |
| Frontend Docker build Vite | EXITOSA | Build del target `build`; Vite produjo artefactos. |
| ESLint frontend | EXITOSA | `npm run lint` dentro de imagen target de build; sin errores. |
| Sintaxis JavaScript backend | EXITOSA | `node --check` sobre `.js` bajo `backend/src` y `backend/test` en imagen Node 22. |
| Unit tests backend | EXITOSA | 6 pruebas: login correcto, incorrecto, inactivo/no existente, validación de entrada, hash/verificación Argon2id y rechazo de identidad Google no provisionada. |
| Compose dev y dev+prod | EXITOSA | `docker compose config -q` en ambos modos con valores dummy sólo para validar interpolación; valores no guardados ni impresos. |
| Bootstrap sin configuración | EXITOSA (fallo seguro esperado) | El proceso termina con mensaje claro antes de conectar a SQL; no crea cuentas. |
| SP/bootstrap/login en SQL Server aislado | EXITOSA | Contenedor SQL Server efímero: inicialización aplicó esquema, primer bootstrap creó Admin, segunda ejecución informó `already_exists`, login con contraseña alternativa falló, contraseña original funcionó, cookie HttpOnly y `/access/me` funcionaron, y el listado mostró exactamente un Administrador. Red y contenedor temporal eliminados al finalizar. |
| Desactivación del único Administrador | EXITOSA | SQL Server efímero: `PUT /access/users/:id/active` respondió HTTP 409; `GET /access/me` confirmó que la cuenta permaneció activa. |
| Suite E2E histórica Fase 1, Google real y correo | NO EJECUTADAS | Las pruebas de autenticación nuevas sí corrieron con API simulada; no se probó SQL/OIDC/correo reales. |

Bootstrap/login: `docs/bootstrap-admin.md`. Informe de alcance y pendientes: `docs/FASE_2_IMPLEMENTACION.md`.

## Verificación histórica de Fase 0

Ejecución local: 2026-10-31, Docker Desktop sobre host `arm64` (Apple Silicon). SQL Server se ejecutó como `linux/amd64` bajo emulación. La prueba se completó, aunque Microsoft no soporta esa configuración.

| Verificación | Resultado | Evidencia |
|---|---|---|
| Sintaxis de `docker-compose.yml` | EXITOSA | `docker compose config -q` |
| Sintaxis de desarrollo + producción | EXITOSA | `docker compose -f docker-compose.yml -f docker-compose.prod.yml config -q` |
| Build frontend | EXITOSA | Imagen de desarrollo; `npm run build` Vite dentro de la etapa de producción |
| Build backend | EXITOSA | Imagen Node/Express construida por Compose |
| Arranque de desarrollo | EXITOSA | Los seis servicios solicitados levantados; los dos inicializadores terminaron con código 0 |
| Arranque de producción | EXITOSA | Frontend estático, backend, proxy y dependencias respondieron. Prueba local usó temporalmente `MSSQL_PID=Developer` y `SQLSERVER_TRUST_SERVER_CERTIFICATE_PROD=true`; no equivale a un despliegue de producción licenciado/TLS |
| Estado de salud | EXITOSA | frontend, backend, SQL Server, Redis, MinIO y Nginx healthy; init jobs completados |
| `GET /health` | EXITOSA | HTTP 200 a través de `http://localhost/api/health` |
| `GET /health/ready` | EXITOSA | HTTP 200, SQL Server/Redis/MinIO disponibles |
| Readiness cuando SQL está detenido | EXITOSA | HTTP 503 y SQL marcado `unavailable`; volvió a HTTP 200 tras restaurar SQL |
| Conexión backend → SQL Server | EXITOSA | Pool conectado como `app_user`; nombre de base confirmado como `AI_MARKETING_MANAGER` |
| Conexión backend → Redis | EXITOSA | `PING` dentro de readiness y respuesta `available` |
| Conexión backend → MinIO | EXITOSA | Comprobación autenticada del bucket devolvió `available` |
| Existencia del bucket | EXITOSA | Inicializador idempotente creó `ai-marketing-manager`; comprobación del backend pasó |
| Persistencia después de reiniciar servicios | EXITOSA | SQL conservó la base tras reinicio; Redis conservó una clave AOF; MinIO conservó bucket y objeto de prueba. El objeto y la clave temporales se eliminaron después |

La descarga inicial de la imagen SQL Server fue lenta, pero terminó. El contenedor reportó `x86_64` y pasó el healthcheck en el Mac M3. Esto demuestra que la configuración local de emulación pudo ejecutarse en esta sesión; no constituye compatibilidad ARM64 nativa ni soporte de Microsoft.

Durante la implementación, `minio/minio` y `minio/mc` en Docker Hub no se pudieron descargar y Quay devolvió 401. Para completar la verificación se fijó por digest una imagen multi-arquitectura de Chainguard que contiene MinIO; el bucket se inicializa con el SDK `minio` incluido en el backend.

---

# Auditoría de Fase 1 — frontend

Fecha de ejecución: 2026-10-31 (America/Guatemala). Se conservaron las pruebas anteriores de Fase 0 como registro heredado; las verificaciones de esta sección corresponden específicamente al frontend de Fase 1.

La sección siguiente es el snapshot de la primera auditoría de Fase 1. Sus pruebas marcadas NO EJECUTADA quedan actualizadas por los resultados de «Cierre funcional de Fase 1.1» al final de este archivo.

## Builds y producción

| Verificación | Resultado | Evidencia |
|---|---|---|
| Compose de desarrollo y combinación de producción | EXITOSA | `docker compose config -q` y `docker compose -f docker-compose.yml -f docker-compose.prod.yml config -q` |
| Build de imagen frontend de desarrollo | EXITOSA | `docker compose build frontend`; imagen `ai-marketing-manager-frontend:dev` construida |
| Build estático de producción | EXITOSA | Build Docker `ai-marketing-manager-frontend:prod`; `npm run build` ejecutado en la etapa de build y artefactos copiados a `/usr/share/nginx/html` |
| Nginx del contenedor de producción | EXITOSA | Ejecución aislada de la imagen con nombre único y puerto aleatorio asignado por Docker (`127.0.0.1:62910` en esta ejecución); imagen `ai-marketing-manager-frontend:prod`, entrypoint `/docker-entrypoint.sh` |
| Portada y ruta React directa en Nginx de producción | EXITOSA | `/` y `/channels/instagram` devolvieron HTTP 200. La ruta directa devolvió `index.html` mediante el fallback SPA |
| Recursos JavaScript, CSS e ilustración SVG | EXITOSA | HTTP 200: JS `/assets/index-C5kVEbgh.js` (203039 bytes), CSS (54815 bytes) y `/mock/posts/post-01.svg` (887 bytes) |
| Nombre de contenedor no colisionante | EXITOSA | Nombre único `amm-prod-audit-20261031-19651`; contenedor temporal detenido después de la prueba |

La colisión reportada como `failed to set up container networking` fue un conflicto de publicación del puerto host: `127.0.0.1:8081` ya estaba asignado al servicio `kanban-proxy-1` de otro proyecto. Docker no pudo enlazar ese puerto al contenedor temporal. No era un fallo del build ni de la red del stack AI Marketing Manager. Se repitió usando un nombre de contenedor único y asignación automática de puerto libre; la comprobación terminó correctamente.

## Vistas y navegación

Se abrieron con Chromium las once rutas del build estático de producción y se comprobó que React montó su vista mediante un encabezado principal:

| Vista/ruta | Resultado | Evidencia |
|---|---|---|
| Dashboard `/` | EXITOSA | Encabezado «Buenos días, Sofía» y contenido de dashboard renderizado |
| Facebook `/channels/facebook` | EXITOSA | Vista de canal renderizada |
| Instagram `/channels/instagram` | EXITOSA | Vista de canal renderizada; ruta directa, HTTP 200 |
| TikTok `/channels/tiktok` | EXITOSA | Vista de canal renderizada |
| Comparación `/comparison` | EXITOSA | Encabezado «Comparación de canales» |
| Reportes `/reports` | EXITOSA | Encabezado «Reportes» |
| Inteligencia Artificial `/ai` | EXITOSA | Encabezado «Inteligencia Artificial» |
| WhatsApp `/whatsapp` | EXITOSA | Encabezado «WhatsApp» |
| Conexiones `/connections` | EXITOSA | Encabezado «Conexiones» |
| Usuarios `/users` | EXITOSA | Encabezado «Usuarios» |
| Ajustes `/settings` | EXITOSA | Encabezado «Ajustes» |
| Navegación por clic entre enlaces del sidebar | NO EJECUTADA | Se inspeccionaron los `NavLink` y cada ruta directa, pero no se pudo completar automatización de interacción del navegador |

## Responsive

Se generaron e inspeccionaron capturas Chromium del build de producción con viewports 1440×1000 (Dashboard), 834×1112 (Instagram) y 390×844 (WhatsApp). Las capturas muestran la barra lateral de escritorio, el header compacto en tablet y el layout apilado con navegación móvil en móvil. Las media queries del stylesheet definen los breakpoints de 1250, 900 y 640 px; tablas usan contenedor con scroll horizontal.

| Verificación | Resultado | Evidencia |
|---|---|---|
| Revisión visual de escritorio | EXITOSA | Captura 1440×1000 inspeccionada; sidebar expandida y Dashboard en rejilla |
| Revisión visual de tablet | EXITOSA | Captura 834×1112 inspeccionada; header compacto y canal en dos columnas |
| Revisión visual de móvil | EXITOSA | Captura 390×844 inspeccionada; controles y contenido WhatsApp en columna y botón de menú visible |
| Todos los módulos en los tres viewports y prueba de desbordamiento horizontal | NO EJECUTADA | No hubo automatización DOM disponible para iterar y medir las once vistas en los tres tamaños |
| Apertura/cierre interactivo del menú móvil | NO EJECUTADA | El botón y clases responsive se inspeccionaron en el código; no se automatizó el clic |

## Filtros e interacciones de interfaz

| Verificación | Resultado | Evidencia |
|---|---|---|
| Filtros 7/30/90/180 días y rango personalizado | NO EJECUTADA | El proveedor comparte período; gráficas y KPIs consumen los datos mock por período. No fue posible automatizar el cambio desde controles |
| Selector de cuenta/canal | NO EJECUTADA | Control local presente en el header de canales; clic no automatizado |
| Filtro de canal en Reportes | NO EJECUTADA | Selector y filtrado de publicaciones presentes en `ReportsPage`; interacción no automatizada |
| Búsqueda de usuarios | NO EJECUTADA | Filtrado local por nombre, correo o rol implementado; interacción no automatizada |
| Búsqueda de conversaciones de WhatsApp | NO EJECUTADA | Filtrado local por nombre implementado; interacción no automatizada |
| Agregar/editar/desactivar usuario | NO EJECUTADA | Modal y cambios locales implementados; interacción no automatizada |
| Conectar/desconectar plataforma | NO EJECUTADA | Toggle local implementado; interacción no automatizada |
| Mensaje de demostración en IA/WhatsApp, pestañas y menús | NO EJECUTADA | Manejadores locales inspeccionados, sin automatización de clic/teclado |
| Paginación | FALLIDA | No hay paginación implementada en la tabla de usuarios ni en la tabla de publicaciones de reportes; las filas se muestran juntas |

La imagen `mcr.microsoft.com/playwright:v1.64.1-noble` disponible en el entorno contiene Chromium pero no el paquete npm de Playwright. La instalación temporal del paquete no respondió desde el entorno Docker, por lo que no se reportan como ejecutadas pruebas interactivas, consola de navegador o medición de overflow. La prueba con Chromium sí confirmó el renderizado de las rutas y permitió la inspección visual de los tres viewports.

Las capturas headless tomaron los gráficos mientras la animación de trazo de Recharts seguía en su primer frame; por ello los ejes y leyendas se ven, pero los trazos no aparecen en esas capturas. El DOM renderizado contiene paths SVG con datos y trazos configurados. No se pudo esperar ni verificar con automatización que la animación termine en un navegador interactivo; la apariencia final de los trazos queda pendiente de comprobación visual manual.

## Arquitectura frontend y hallazgos

La inspección del código confirma separación por layout, componentes compartidos, gráficas, módulos de página, datos mock centralizados en `src/mock/marketingData.js` y contexto común de período. El enrutador carga módulos con `React.lazy`. Los mocks se importan directamente desde módulos; no existe una capa `services/` que los encapsule. No se hizo refactor por tratarse de una auditoría. `docker compose logs --since=10m frontend` no mostró errores de Vite; no equivale a una revisión exhaustiva de consola React en navegador.

| Hallazgo | Estado |
|---|---|
| Búsqueda global del header | Pendiente: abre el campo de búsqueda, pero no filtra ni navega resultados |
| Paginación en tablas | Pendiente: ausente; ver resultado FALLIDA arriba |
| Rango de fechas personalizado invertido | Pendiente: se acepta `Desde` posterior a `Hasta`; el conteo usa diferencia absoluta y las etiquetas de fecha pueden quedar descendentes |
| Acciones de demostración sin efecto | Pendiente: algunos botones como configuración/llamada en WhatsApp o «Ver todo» son visuales y no ejecutan una acción local |
| Persistencia de acciones | Esperado: conexiones, usuarios, preferencias y mensajes se reinician al recargar; son mocks en memoria |

## Continuidad de Fase 0

| Verificación | Resultado | Evidencia |
|---|---|---|
| Seis servicios de desarrollo saludables tras la auditoría | EXITOSA | `docker compose ps`: frontend, backend, SQL Server, Redis, MinIO y Nginx aparecen healthy |
| Compose base y combinado de producción siguen válidos | EXITOSA | Ambos comandos `docker compose config -q` se ejecutaron después de la auditoría |
| Frontend de desarrollo y API tras la auditoría | EXITOSA | `http://localhost/` HTTP 200; `/api/health` HTTP 200; `/api/health/ready` HTTP 200 |
| Funciones y pruebas de persistencia Fase 0 | EXITOSA (heredada) | Evidencia y alcance permanecen en la sección «Verificación de Fase 0» al inicio de este documento; no se repitieron en esta auditoría |

## Problemas pendientes

- Añadir paginación local si el volumen de filas de demostración lo requiere.
- Hacer que la búsqueda global filtre resultados o presentar claramente su carácter de placeholder.
- Validar y corregir rangos de fechas invertidos.
- Automatizar clics y estados de las interacciones con una instalación funcional de Playwright; complementar con barrido de overflow y consola en los once módulos.
- Definir acciones explícitas para controles actualmente decorativos o deshabilitarlos con una indicación de demostración.
- Comprobar visualmente los trazos de Recharts una vez finalizada su animación en navegador interactivo.

No se modificó backend ni infraestructura de Fase 0. No se inició Fase 2.

---

# Cierre funcional de Fase 1.1

Fecha: 2026-10-31 (America/Guatemala). Las pruebas se ejecutaron con Chromium/Playwright 1.64.1 sobre una imagen temporal del build estático de producción, adjunta a la red web del proyecto. El contenedor temporal se retiró; el stack normal quedó en desarrollo.

## Implementado

- Paginación local en Usuarios y Reportes, con selector de filas, página actual, total, botones anterior/siguiente y reinicio al cambiar búsqueda/canal/período.
- Búsqueda global mock de módulos, usuarios iniciales y publicaciones; resultados navegan a la vista y precargan la búsqueda de usuario/publicación.
- Borrador y rango aplicado separados; fechas vacías/inválidas/descendentes se marcan y no se pueden aplicar. El rango de un día produce un solo dato y marcador.
- Acciones locales o mensajes claros para controles que no ejecutaban una acción, incluidos opciones del perfil/canal, avisos, perfil de WhatsApp, llamadas/adjuntos, historial de IA y actualización simulada de sincronización.
- Mensajes simulados almacenados por conversación durante la vista.
- ESLint, configuración de hooks y Playwright E2E (`npm run lint`, `npm run test:e2e`).

## Pruebas ejecutadas

| Verificación | Resultado | Evidencia |
|---|---|---|
| `npm run lint` | EXITOSA | ESLint terminó sin errores ni advertencias |
| `npm run build` | EXITOSA | Vite v5.4.21 produjo el build estático |
| Build Docker desarrollo y producción | EXITOSA | `docker compose build frontend` y build combinado producción; producción ejecuta `npm run build` |
| Suite Playwright final | EXITOSA | 13 pruebas pasaron, 0 fallidas; comprobación `pageerror` y errores de consola sin errores en todas las pruebas |
| Navegación por sidebar en once módulos | EXITOSA | Playwright hizo clic en cada destino y comprobó ruta y vista renderizada |
| Acceso directo a `/channels/instagram` en producción | EXITOSA | Nginx HTTP 200, React renderizado y recursos script/style/imagen sin respuesta fallida |
| Búsqueda global de módulo/usuario/publicación | EXITOSA | Navegación al canal, búsqueda de usuario precargada y publicación filtrada en Reportes |
| Búsqueda global en móvil | EXITOSA | Resultado TikTok abrió la ruta de canal |
| Preset 7 días y rango invertido | EXITOSA | El rango descendente presentó alerta, bloqueó Aplicar y conservó el rango previamente aplicado |
| Rango personalizado de un día | EXITOSA | Se aplicó 21 oct; gráfica de seguidores renderizó sus tres marcadores de un solo punto |
| Paginación, tamaño de página y filtro Reportes | EXITOSA | Anterior/siguiente, 3/5 filas y cambio a Instagram reiniciaron en página 1 |
| Paginación, tamaño de página y búsqueda Usuarios | EXITOSA | Cambio de tamaño y búsqueda reiniciaron la página; lista filtrada coherente |
| Edición y desactivación de usuario | EXITOSA | Datos de Sofía cambiaron localmente y estado pasó a Inactivo |
| Conectar/desconectar, actualización y alta informativa | EXITOSA | Estado del canal alternó; actualización cambió hora simulada; alta informó que el asistente es futuro |
| Conversación WhatsApp secundaria y mensaje | EXITOSA | Se abrió Carlos, feedback de llamada/adjunto, emoji y envío de mensaje local visibles |
| Conversación IA e historial | EXITOSA | Prompt produjo respuesta mock y «Ver todo» expandió actividad |
| Menú móvil | EXITOSA | Menú abrió, navegó a Instagram y se cerró al cambiar de ruta |
| Perfil, avisos, perfil de canal y vista general | EXITOSA | Notificaciones se marcaron leídas, Preferencias abrió Ajustes y perfiles/Comparación dieron feedback |
| Recharts tras animación | EXITOSA | Paths visibles con geometría/stroke y dasharray distinto del frame inicial tras espera de 2.2 s |
| Compatibilidad de Compose | EXITOSA | Configuración base y combinación de producción se validaron en la auditoría y no fueron modificadas en 1.1 |

El primer pase de Playwright detectó el envío de mensajes oculto al seleccionar una conversación distinta de la inicial y un matcher mal llamado en el test de paginación. Se corrigió el estado para conservar mensajes por conversación y se reparó la aserción. En el pase final todas las pruebas quedaron exitosas.

## Continuidad de Fase 0

| Verificación posterior a 1.1 | Resultado | Evidencia |
|---|---|---|
| Frontend y proxy de desarrollo | EXITOSA | Se actualizó solo `frontend` y se comprobó `http://localhost/` y `/channels/instagram` HTTP 200 |
| Backend y dependencias | EXITOSA | No se recrearon. `docker compose ps` muestra seis servicios healthy |
| API health y readiness | EXITOSA | `/api/health` HTTP 200 y `/api/health/ready` HTTP 200 con SQL Server, Redis y MinIO disponibles |
| Persistencia e inicializadores de Fase 0 | EXITOSA (heredada) | Sin cambios ni repetición; consultar snapshot de Fase 0 arriba |

## Pendientes y limitaciones

- Los datos/acciones de frontend son memoria local y vuelven a mocks al recargar.
- La búsqueda global contempla los usuarios mock iniciales, no usuarios agregados en una sesión; no comparte el estado temporal de la tabla.
- Los botones de llamadas, adjuntos, exportación, conexión futura y perfil real explican la limitación; no realizan operaciones externas.
- Preferencias de apariencia/densidad se muestran como simulación y no cambian el tema o espaciado del prototipo.
- `npm audit --omit=dev` informa dos vulnerabilidades moderadas en `react-router` transitivo de `react-router-dom` 6.x. npm ofrece resolverlas con React Router 7.18.5, que requiere migración major; se mantiene pendiente por compatibilidad y fuera de estas correcciones funcionales.
- La tabla histórica de la auditoría 1.0 refleja el estado antes de las correcciones; los resultados finales de 1.1 están en esta sección.

No se modificó backend ni configuración Docker/Compose. No se inició Fase 2.

## Fase 2 — implementación parcial

Fecha: 2026-11-01. Se agregó el esquema SQL y las rutas autenticadas de permisos, listado autorizado de comercios/cuentas, y la matriz editable en Usuarios. El bootstrap aplica el esquema y concede `EXECUTE` a `app_user`.

| Verificación | Resultado | Evidencia |
|---|---|---|
| Compose de desarrollo | EXITOSA | `docker compose config -q` |
| Compose combinado de producción | EXITOSA | `docker compose -f docker-compose.yml -f docker-compose.prod.yml config -q` |
| ESLint frontend | EXITOSA | `docker compose run --rm --no-deps frontend npm run lint` |
| Build frontend | EXITOSA | `docker compose run --rm --no-deps frontend npm run build` |
| Sintaxis JavaScript backend | EXITOSA | `node --check` sobre todos los archivos backend dentro de la imagen Node |
| Playwright | NO EJECUTADA | No se ejecutó suite de navegador |
| Pruebas SQL de aislamiento requeridas | PENDIENTES | No hay una instancia SQL disponible en esta sesión ni se ejecutó el bootstrap actualizado |

La prueba de seguridad integral aún no está cerrada: login/emisión de JWT, endpoints de métricas/publicaciones/reportes y consumo de esos endpoints por Dashboard/Canales no existen. Esas vistas siguen usando datos mock y no deben habilitarse para usuarios reales. Antes de declarar Fase 2 completa se deben cubrir los diez escenarios requeridos con dos Viewers y procedimientos de datos reales.

| Escenario requerido | Estado |
|---|---|
| Viewer sin permisos | Pendiente de prueba SQL/API |
| Viewer con un comercio | Pendiente de prueba SQL/API |
| Viewer con dos comercios | Pendiente de prueba SQL/API |
| Viewer con Facebook e Instagram en un comercio | Pendiente de prueba SQL/API |
| Viewer con TikTok de otro comercio | Pendiente de prueba SQL/API |
| Manipulación de BusinessId en URL | No hay endpoint de métricas para probar |
| Manipulación de SocialPlatformId | Listado de cuentas filtra en SQL; prueba de rechazo pendiente |
| Revocación con sesión activa | SP vuelve a consultar permisos; prueba concurrente pendiente |
| Administrador con todos los comercios | Predicado implementado; prueba de integración pendiente |
| Aislamiento de dos Viewers | Pendiente de prueba SQL/API |

### Inicio de sesión Google

Se cargó el cliente web de `docs/client_secret_google.json` en `.env` sin imprimir sus secretos, y se aplicó el esquema actualizado. `GET /api/auth/google` llegó a la página de inicio de sesión de Google (HTTP 200, host `accounts.google.com`) sin error de cliente ni `redirect_uri_mismatch`. La cancelación del consentimiento vuelve a la app con un error genérico y sin token; `/api/access/me` sin sesión devuelve 401. La autorización exitosa de una cuenta no se completó en esta prueba porque requiere interacción en una sesión Google del usuario. El enlace de prueba está en la app: `/api/auth/google`.
