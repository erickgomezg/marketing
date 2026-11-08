# AI Marketing Manager
## Plan maestro de arquitectura y desarrollo

**Versión:** 3.0  
**Estado:** Reinicio del proyecto desde FASE 0  
**Objetivo:** Construir una plataforma de gestión de marketing multicanal, potenciada por IA, modular, segura y preparada para desplegarse mediante Docker Compose.

---

# 1. Visión del producto

AI Marketing Manager permitirá administrar y analizar canales de marketing desde una sola plataforma. Integrará Meta (Facebook e Instagram) y TikTok mediante conexiones independientes, ofrecerá dashboards individuales y comparativos, analizará campañas y publicaciones con IA y permitirá gestionar comunicaciones y aprobaciones mediante WhatsApp.

El desarrollo será incremental por fases. Cada fase deberá quedar funcional, documentada, probada y ejecutable mediante Docker antes de comenzar la siguiente. No se avanzará de fase sin autorización expresa.

# 2. Objetivos funcionales

- Conectar una cuenta de Meta y descubrir los recursos autorizados de Facebook Pages e Instagram Professional Accounts.
- Permitir visualizar Facebook e Instagram individualmente o compararlos.
- Conectar TikTok de forma independiente y utilizar únicamente las capacidades autorizadas por sus APIs y scopes.
- Consultar métricas, campañas y publicaciones disponibles según los permisos de cada proveedor.
- Presentar dashboards, reportes y análisis de IA.
- Permitir que la IA genere recomendaciones y proponga acciones.
- Solicitar aprobación de usuarios autorizados mediante WhatsApp antes de ejecutar acciones sensibles.
- Administrar usuarios, roles y permisos.
- Mantener auditoría de conexiones, recomendaciones, aprobaciones y acciones ejecutadas.
- Permitir autenticación tradicional y acceso mediante cuenta Google.

# 3. Reglas arquitectónicas obligatorias

## 3.1 Clean Architecture

El backend Node.js debe aplicar Clean Architecture y separación de responsabilidades:

- **Domain:** entidades, reglas de dominio, contratos e invariantes.
- **Application:** casos de uso, DTOs y coordinación de operaciones.
- **Infrastructure:** SQL Server, repositorios, proveedores externos, Redis, MinIO y adaptadores.
- **Presentation:** rutas, controladores, middlewares y validadores HTTP.

Las dependencias deben apuntar hacia el interior. Los casos de uso no deben depender de SQL Server, Express ni SDKs de proveedores.

Estructura orientativa:

```text
backend/src/
├── Domain/
│   ├── Entities/
│   ├── Interfaces/
│   └── Exceptions/
├── Application/
│   ├── UseCases/
│   ├── DTOs/
│   └── Services/
├── Infrastructure/
│   ├── Database/
│   │   ├── Connection/
│   │   └── StoredProcedures/
│   ├── Repositories/
│   ├── Providers/
│   ├── Cache/
│   └── Storage/
├── Presentation/
│   ├── Controllers/
│   ├── Routes/
│   ├── Middlewares/
│   └── Validators/
└── main.js
```

## 3.2 SQL Server y Stored Procedures: regla estricta

Microsoft SQL Server será el único motor relacional del proyecto.

**Está prohibido ejecutar consultas SQL directamente desde el código de la aplicación.** No se permiten `SELECT`, `INSERT`, `UPDATE`, `DELETE`, SQL concatenado, Query Builders ni consultas ad hoc desde controladores, casos de uso o repositorios.

Toda operación relacional debe invocar un Stored Procedure de SQL Server.

Se utilizará el driver `mssql` únicamente desde Infrastructure. Los repositorios enviarán parámetros tipados y ejecutarán procedimientos mediante `.execute()`.

### Un procedimiento por entidad

Se utilizará un Stored Procedure por entidad, centralizando las operaciones mediante `@accion`. Ejemplo conceptual:

```sql
EXEC dbo.SP_USER
    @accion = 'save',
    @userName = N'Usuario',
    @email = N'usuario@ejemplo.com';
```

Acciones comunes, cuando correspondan:

- `save`: crear.
- `get`: obtener un registro.
- `list`: listar o buscar con filtros/paginación.
- `update`: actualizar.
- `delete`: eliminar o aplicar baja lógica.

Reglas adicionales:

- Cada SP valida las acciones y parámetros requeridos.
- Utilizar parámetros tipados; nunca concatenar valores para formar SQL.
- La lógica de acceso y modificación de datos reside en los SP.
- Manejar transacciones dentro del SP cuando una operación abarque varias tablas.
- Manejar errores con `TRY/CATCH` y `THROW`.
- Definir contratos de resultados consistentes.
- Considerar concurrencia, índices, auditoría y baja lógica según la entidad.
- El usuario SQL de la aplicación tendrá permisos mínimos: ejecutar los SP autorizados y no acceso general innecesario a tablas.
- Los scripts de tablas y SP se versionarán en el repositorio.
- No crear SP gigantes difíciles de mantener; mantener acciones claras y bien delimitadas dentro del SP de la entidad.

La validación de entrada también debe existir en la aplicación. Las reglas de integridad y consistencia de datos deben protegerse en la base de datos.

## 3.3 Proveedores y canales

Separar los conceptos:

- **Provider:** plataforma/proveedor externo, por ejemplo `META` o `TIKTOK`.
- **Connection:** autorización y credenciales/tokens de un proveedor.
- **Channel:** recurso que el usuario puede seleccionar, por ejemplo una Facebook Page, una cuenta profesional de Instagram o una cuenta TikTok.

Modelo conceptual:

```text
Provider
  └── Connection
        └── Channel
              ├── Metrics
              ├── Content
              ├── Campaigns (si aplica)
              └── Insights
```

Una conexión Meta puede descubrir y administrar recursos autorizados de Facebook e Instagram. TikTok tendrá una conexión independiente. No asumir que todas las plataformas ofrecen las mismas métricas ni capacidades.

## 3.4 Métricas normalizadas

Crear una capa de normalización que conserve:

- Nombre/código interno de la métrica.
- Proveedor y canal de origen.
- Valor y unidad.
- Período y granularidad.
- Fecha de extracción.
- Definición/origen de la métrica.
- Disponibilidad y limitaciones del proveedor.

No comparar métricas cuando sus definiciones, períodos o unidades no sean equivalentes. La interfaz debe identificar métricas no disponibles o no comparables.

## 3.5 Seguridad

- Secretos únicamente en variables protegidas o Docker secrets; nunca en código ni frontend.
- Tokens de proveedores almacenados cifrados en reposo cuando se implemente la integración.
- API keys de IA únicamente en backend.
- Autorización y RBAC validados en backend, no solamente ocultando elementos de UI.
- Validación de entradas, rate limiting y auditoría.
- HTTPS en producción.
- No registrar contraseñas, tokens ni secretos en logs.
- No confiar en datos de identidad enviados por el frontend.
- Aplicar mínimo privilegio a usuarios de aplicación y servicios.

# 4. Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React JS + Vite |
| Backend | Node.js |
| API | REST |
| Base relacional | Microsoft SQL Server |
| Acceso a SQL Server | Driver `mssql` + Stored Procedures |
| Cache/colas ligeras | Redis |
| Almacenamiento de objetos | MinIO compatible con S3 |
| Proxy web | Nginx |
| Contenedores | Docker |
| Orquestación inicial | Docker Compose |
| IA inicial | OpenAI API, desacoplada mediante interfaz de proveedor |
| Meta | Meta Graph API / Marketing API, según permisos |
| TikTok | APIs oficiales y scopes aprobados |
| WhatsApp | Gateway desacoplado con sesión QR tipo WhatsApp Web/Baileys, sujeto a riesgos y términos de la plataforma |
| Autenticación social | Google OAuth 2.0 / OpenID Connect |

La arquitectura de IA debe permitir incorporar otros proveedores en el futuro sin modificar los casos de uso centrales.

# 5. Docker First: requisito obligatorio

Todo el proyecto debe poder ejecutarse mediante Docker Compose. No depender de instalaciones manuales de Node.js, SQL Server, Redis, MinIO o Nginx en el host.

Cada servicio ejecutable tendrá su Dockerfile cuando corresponda. Todos los servicios necesarios estarán declarados en Compose.

## 5.1 Servicios previstos

- `frontend`: aplicación React; en producción se servirá mediante Nginx.
- `backend`: API Node.js.
- `sqlserver`: Microsoft SQL Server con volumen persistente.
- `redis`: cache/colas y persistencia configurada según el uso.
- `minio`: almacenamiento de objetos con volumen persistente.
- `nginx`: punto de entrada y enrutamiento, evitando duplicar innecesariamente el proxy.
- Futuros servicios, como `whatsapp-gateway` y workers, se incorporarán como contenedores independientes cuando corresponda.

## 5.2 Compose de desarrollo y producción

Mantener una definición base `docker-compose.yml` y un override `docker-compose.prod.yml`.

Desarrollo:

```bash
docker compose up -d --build
```

Producción:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Producción debe usar imágenes/builds adecuados, puertos expuestos mínimos, políticas de reinicio, health checks, redes internas, secretos/variables protegidas y configuración HTTPS.

No publicar SQL Server, Redis ni MinIO directamente a Internet. La exposición administrativa debe ser restringida.

## 5.3 Persistencia y operación

- Volumen persistente para archivos de datos de SQL Server.
- Volumen persistente para MinIO.
- Persistencia Redis configurada de acuerdo con los datos que se decida conservar.
- Volumen para sesiones de WhatsApp cuando se implemente el gateway.
- Health checks reales y dependencias de arranque razonables.
- Política de reinicio.
- Logs a stdout/stderr para que Docker los gestione.
- Procedimientos documentados de backup y restauración de SQL Server y MinIO.
- No depender de que un contenedor mantenga datos importantes en su filesystem efímero.
- `docker compose down` no debe eliminar datos persistentes; nunca usar `down -v` como procedimiento normal.

## 5.4 SQL Server en Docker

Usar una imagen oficial compatible con el entorno del servidor de destino y aceptar la licencia mediante la variable correspondiente. La contraseña de administrador debe venir de un secreto o variable protegida. No utilizar la cuenta `sa` desde la aplicación en producción: crear un login de aplicación con privilegios mínimos.

Documentar arquitectura de CPU, memoria mínima, licencia/edición y compatibilidad del host antes de desplegar. No asumir que una imagen SQL Server Linux soporta cualquier arquitectura de CPU. En particular, verificar la compatibilidad en Mac con Apple Silicon (M3); si se requiere `linux/amd64` mediante emulación, documentar sus limitaciones y no presentarlo como soporte ARM64 nativo.

# 6. Frontend: dirección visual

Diseño moderno, minimalista, profesional e inspirado en interfaces Apple.

Paleta:

- Primario: `#2773F5`
- Secundario: `#27B7F5`
- Texto: `#1D1D1F`
- Fondo: `#F7F8FA`
- Superficies: blanco

Características:

- Sidebar colapsable.
- Header limpio.
- Cards con bordes redondeados y sombras suaves.
- Responsive para desktop, laptop y tablet.
- Accesibilidad, estados loading/empty/error y navegación clara.
- Evitar dashboard genérico, saturación visual y gradientes innecesarios.

Secciones previstas:

- Dashboard
- Reportes
- Conexiones
- Inteligencia Artificial
- WhatsApp
- Usuarios y Roles
- Ajustes

Dashboard:

- Selector de canal.
- Selector de período.
- Vista de un canal o comparación de dos o más canales.
- KPIs.
- Evolución de métricas.
- Campañas cuando la plataforma las proporcione.
- Publicaciones.
- Insights de IA.

# 7. Roles iniciales

- **Administrador:** administración general, configuración, conexiones, usuarios y visualización de todos los canales autorizados.
- **Viewer:** visualización de dashboards y reportes únicamente de los canales que tenga asignados.

RBAC se implementará en una fase posterior. El backend será la autoridad para validar permisos.

# 8. Integraciones y consideraciones

## 8.1 Meta

Una conexión Meta debe permitir descubrir recursos autorizados de Facebook Pages e Instagram Professional Accounts. La disponibilidad de métricas, publicaciones, comentarios y acciones depende de permisos, tipo de cuenta, endpoints y revisión de Meta.

No asumir que una cuenta personal de Instagram proporciona las mismas capacidades que una cuenta profesional.

## 8.2 TikTok

TikTok es un proveedor independiente. Las APIs de perfil, videos, comentarios, publicación y publicidad son productos/capacidades diferentes y pueden requerir scopes, revisión y aprobación. Implementar únicamente capacidades verificadas y autorizadas. No prometer paridad con Meta.

## 8.3 WhatsApp

El gateway QR tipo WhatsApp Web/Baileys se mantendrá aislado del backend principal. Es una integración no oficial y puede implicar riesgos de disponibilidad, bloqueo y cumplimiento de términos. Evaluar el uso de un número dedicado y documentar las limitaciones. Mantener una interfaz para poder sustituirlo por WhatsApp Business Platform en el futuro.

## 8.4 IA y aprobaciones

Flujo objetivo:

```text
Proveedor de datos
   -> análisis IA
   -> recomendación
   -> acción pendiente
   -> solicitud de aprobación por WhatsApp
   -> aprobación de usuario autorizado
   -> ejecución por API del proveedor
   -> resultado y auditoría
```

La IA no ejecutará acciones sensibles sin autorización explícita y verificable. Toda acción debe registrar quién la propuso, quién aprobó, cuándo se ejecutó y cuál fue el resultado.

## 8.5 Autenticación con Google

La aplicación ofrecerá dos alternativas de acceso:

1. Correo/usuario y contraseña.
2. Iniciar sesión con Google.

La autenticación Google se implementará en **FASE 2**, no en FASE 0 ni FASE 1. Se utilizará OAuth 2.0 / OpenID Connect. El backend deberá validar la identidad y los claims del token de Google (incluidos emisor, audiencia, expiración y firma mediante el mecanismo oficial), y no confiar en información de identidad enviada directamente por el frontend.

Después de validar la identidad, el backend establecerá la sesión propia de AI Marketing Manager y emitirá su JWT o mecanismo de sesión. La aplicación deberá definir un proceso seguro para vincular una identidad Google con una cuenta existente; no se permitirá tomar control de una cuenta únicamente por coincidencia de texto del correo. El login tradicional utilizará almacenamiento seguro de contraseñas mediante hash resistente (por ejemplo Argon2id o bcrypt con parámetros adecuados).

Variables previstas para la fase de autenticación:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Las credenciales se mantendrán exclusivamente en backend y en configuración protegida.

# 9. Plan de desarrollo por fases

Cada fase debe finalizar con build, pruebas, documentación y verificación Docker. No avanzar automáticamente.

## FASE 0 — Reinicio de infraestructura y base técnica

Objetivo: dejar el esqueleto técnico del proyecto ejecutable y verificable mediante Docker Compose.

- Revisar este plan y confirmar el alcance de FASE 0.
- Crear estructura del repositorio.
- Configurar Docker Compose de desarrollo y producción.
- Contenedores de frontend, backend, SQL Server, Redis y MinIO.
- Configurar Nginx/proxy según la arquitectura elegida.
- Configurar persistencia, health checks y redes.
- Backend mínimo con `GET /health` y `GET /health/ready`.
- Probar conectividad real desde backend hacia SQL Server, Redis y MinIO.
- Preparar scripts versionados y mecanismo de inicialización de SQL Server sin implementar aún el modelo de negocio.
- Crear `.env.example`, `.gitignore`, README y documentación de arquitectura, base de datos y despliegue.
- Documentar compatibilidad de SQL Server con el equipo de desarrollo y con el entorno de producción.
- No implementar login, JWT, Google OAuth, usuarios, roles, dashboard funcional, Meta, TikTok, IA ni WhatsApp.
- No crear todavía tablas de negocio ni Stored Procedures de entidades de negocio.

## FASE 1 — Frontend y experiencia visual multicanal

- Construir layout, navegación, header y sistema visual.
- Dashboard con datos mock.
- Selector de canal y selector de período.
- Vista individual y comparativa.
- Mock de Facebook, Instagram y TikTok.
- KPIs, gráficas, campañas/publicaciones ilustrativas e insight mock.
- Componentes reutilizables y servicios/adaptadores.
- Sin autenticación ni integraciones reales.

## FASE 2 — Autenticación y RBAC

- Usuarios y autenticación tradicional.
- Login con Google OAuth 2.0 / OpenID Connect.
- Validación del token Google exclusivamente en backend.
- Vinculación segura entre identidad Google y cuenta local.
- JWT/sesión propia de la aplicación.
- Hash seguro de contraseñas.
- Roles, permisos y asignación de canales.
- Protección de rutas y endpoints.
- Stored Procedures por entidad.
- Auditoría de accesos y eventos de autenticación.

## FASE 3 — Modelo de negocio y dashboard backend

- Modelo SQL Server para providers, connections, channels, métricas y permisos.
- SP por entidad con `@accion`.
- Repositorios y casos de uso.
- Dashboard conectado al backend.
- Normalización y disponibilidad de métricas.

## FASE 4 — Integración Meta

- OAuth y gestión segura de tokens.
- Descubrimiento de Facebook Pages e Instagram Professional Accounts.
- Sincronización de datos permitidos.
- Insights y publicaciones según permisos.
- Manejo de expiración, renovación y errores.
- Dashboard individual y comparativo.

## FASE 5 — Integración TikTok

- Registro/configuración de aplicación y OAuth.
- Capacidades habilitadas y scopes aprobados.
- Perfil, videos y métricas disponibles.
- Normalización y dashboard.
- Documentar capacidades no disponibles.

## FASE 6 — Inteligencia Artificial

- Abstracción de proveedores de IA.
- OpenAI como proveedor inicial.
- Análisis de campañas, publicaciones y comentarios disponibles.
- Insights explicables con datos de origen.
- Registro de costos/uso y errores.

## FASE 7 — WhatsApp Gateway

- Servicio aislado y contenerizado.
- Vinculación QR y persistencia de sesión.
- Lista de números autorizados.
- Recepción/envío de mensajes.
- Seguridad, auditoría y recuperación de sesión.
- Mantener opción futura de migración a API oficial.

## FASE 8 — Aprobaciones y automatizaciones

- Acciones pendientes.
- Aprobación/rechazo desde usuarios autorizados.
- Validación de identidad y permisos.
- Ejecución mediante proveedor.
- Auditoría completa y prevención de duplicados.

## FASE 9 — Publicaciones y reportes avanzados

- Informes por canal y período.
- Vista de publicaciones.
- Métricas y comentarios disponibles.
- Exportaciones y reportes programados.

## FASE 10 — Administración y configuración avanzada

- Configuración de proveedores.
- Gestión de conexiones y canales.
- Configuración de IA.
- Usuarios, roles, permisos y parámetros.
- Configuración de notificaciones.

## FASE 11 — Seguridad, QA y rendimiento

- Pruebas unitarias, integración y end-to-end.
- Seguridad de API y secretos.
- Rate limiting y auditoría.
- Pruebas de carga razonables.
- Backups y restauración.
- Revisión de permisos de SQL Server.

## FASE 12 — Producción

- Configuración de dominio y HTTPS.
- Compose de producción.
- Imágenes versionadas.
- Despliegue repetible.
- Monitoreo, logs y alertas.
- Procedimiento de actualización y rollback.
- Backup externo y recuperación.

# 10. Convenciones y calidad

- JavaScript consistente; utilizar TypeScript solo si se acuerda explícitamente antes de incorporarlo.
- Nombres descriptivos y estructura por responsabilidad.
- No introducir dependencias sin justificación.
- No hardcodear IDs, tokens, URLs ni credenciales.
- No colocar secretos en frontend.
- Los datos mock deben estar separados de los componentes.
- Los componentes no deben conocer detalles de proveedores externos.
- Los repositorios son la única capa que ejecuta Stored Procedures.
- Documentar contratos de SP y endpoints.
- Cada cambio de esquema debe incluir scripts versionados y estrategia de despliegue.
- No modificar ni eliminar funcionalidad estable sin justificación.
- No avanzar de fase sin aprobación del usuario.

# 11. Variables de entorno previstas

Crear `.env.example` con nombres y valores de ejemplo no secretos. Ajustar según la implementación. No todas las variables se utilizarán en FASE 0.

```env
NODE_ENV=development
APP_PORT=80
API_PORT=3000

SQLSERVER_HOST=sqlserver
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=AI_MARKETING_MANAGER
SQLSERVER_USER=app_user
SQLSERVER_PASSWORD=
SQLSERVER_ENCRYPT=true
SQLSERVER_TRUST_SERVER_CERTIFICATE=true
SQLSERVER_SA_PASSWORD=

REDIS_URL=redis://redis:6379

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=ai-marketing-manager

JWT_SECRET=
JWT_EXPIRES_IN=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

OPENAI_API_KEY=
OPENAI_MODEL=

META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=

WHATSAPP_SESSION_PATH=/app/sessions
```

No agregar secretos reales al repositorio. El `.env.example` debe contener valores vacíos o claramente ficticios.

# 12. Instrucciones permanentes para Codex

1. Leer este documento antes de iniciar cada fase.
2. Confirmar la fase solicitada y limitar el alcance a ella.
3. Inspeccionar el código existente antes de modificarlo.
4. No reescribir archivos o configuraciones sin necesidad.
5. Respetar Clean Architecture.
6. Respetar SQL Server y la regla de Stored Procedures.
7. Mantener Docker Compose como forma principal de ejecución.
8. Verificar persistencia y health checks.
9. Ejecutar build, lint y pruebas disponibles.
10. Actualizar README y documentación técnica.
11. No inventar capacidades de Meta o TikTok: verificar documentación oficial cuando se implementen.
12. Al terminar, informar estado, archivos, decisiones, pruebas, comandos y pendientes.
13. Si hay un bloqueo, informarlo claramente en vez de declarar la fase completada.
14. No iniciar la siguiente fase sin autorización expresa del usuario.
15. No implementar anticipadamente requisitos de fases posteriores.

# 13. Criterio general de finalización

Una fase se considera completada cuando:

- Sus entregables están implementados.
- Build y lint pasan.
- Las pruebas definidas pasan.
- Los servicios Docker requeridos están saludables.
- La persistencia funciona.
- La documentación está actualizada.
- No se implementaron prematuramente fases posteriores.
- Codex entrega un reporte verificable.

---

**Principio rector:** construir una plataforma modular, segura, mantenible y completamente contenerizada, donde el frontend, backend, base de datos e integraciones puedan evolucionar independientemente sin romper el resto del sistema.
