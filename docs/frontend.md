# Frontend — Fase 1 y correcciones 1.1

La aplicación mantiene React/Vite en desarrollo y build estático detrás de Nginx en producción. Las métricas, publicaciones, conversaciones y conexiones son mocks locales. Fase 2 añadió login, carga de perfil y logout con cookie HttpOnly; la matriz consulta y guarda permisos en el backend. Las altas/ediciones/estados de usuarios aún están deshabilitados hasta contar con invitaciones y endpoints persistentes. No se guardan tokens en `localStorage` ni `sessionStorage`.

## Módulos y arquitectura

- `src/app/`: router de React, shell y estado compartido del período.
- `src/components/layout/`: sidebar colapsable, menú móvil y header.
- `src/components/common/`: UI reutilizable, incluyendo `TablePagination`.
- `src/components/charts/`: gráficas con Recharts.
- `src/components/cards/`: publicaciones, actividad, insights y resúmenes.
- `src/modules/`: Dashboard, canales, comparación, reportes, IA, WhatsApp, conexiones, usuarios y ajustes.
- `src/mock/marketingData.js`: catálogo de datos simulados y series.
- `e2e/phase-1.spec.js`: pruebas de navegador Playwright.
- `e2e/auth-phase2.spec.js`: pruebas de login correcto e incorrecto con API simulada; no validan SQL ni backend.

Los módulos se cargan por ruta. Las rutas de canal son `/channels/facebook`, `/channels/instagram` y `/channels/tiktok`. El contexto de período comparte el rango aplicado entre Dashboard, canales, comparación y reportes.

## Funcionalidades implementadas

- Paginación local en las tablas de Usuarios y Reportes: selector de 3, 5, 10 o 20 filas, anterior/siguiente, página actual y total. Los filtros de búsqueda, canal y período reinician la página.
- Búsqueda global en header para módulos, usuarios mock y publicaciones mock. El menú muestra resultados categorizados y navega al módulo; resultados de usuarios y publicaciones precargan su búsqueda local en destino.
- Rango personalizado con borrador separado del período aplicado. Rangos vacíos, fechas inválidas e inicio posterior al fin muestran error y bloquean Aplicar. Cambiar el borrador inválido no altera las métricas; al aplicar un único día se genera un único punto y la gráfica lo representa con un marcador.
- Acciones de demostración en controles que antes no hacían nada: estado de leído de notificaciones, feedback de perfil/canal, acceso a ajustes de WhatsApp, inserción de emoji, feedback de adjuntos/llamadas, historial de IA expandible y estados informativos para acciones no disponibles.
- Conversaciones WhatsApp mantienen los mensajes de demostración por conversación mientras la vista está montada.
- Gráficas Recharts mantienen sus animaciones; Playwright verifica geometría SVG y visibilidad tras esperar el fin de la animación.
- Lint con ESLint, reglas de Hooks y detección de imports/variables no usados.

## Funcionalidades probadas

La suite `e2e/phase-1.spec.js` prueba en Chromium contra el build estático servido por Nginx:

- Navegación por clic entre los once módulos y acceso directo a ruta profunda.
- Búsqueda global de módulo, usuario y publicación, en escritorio y móvil.
- Preset de período, rango inválido, fecha de un día y marcador de gráfica.
- Paginación, selector de filas y reinicio tras filtros de reportes y usuarios.
- Búsqueda, edición y desactivación de usuario.
- Conectar y desconectar un canal.
- Buscar conversación, navegar a ella, feedback de llamada y envío de mensaje local.
- Respuesta simulada e historial de IA expandible.
- Apertura del menú móvil y navegación desde él.
- Paths de Recharts visibles tras la animación y ausencia de errores de consola JavaScript en los casos ejecutados.
- Ruta profunda Nginx y carga satisfactoria de scripts, estilos e imágenes del build.

Comandos de desarrollo frontend:

```bash
cd frontend
npm run lint
npm run build
PLAYWRIGHT_BASE_URL=http://localhost npm run test:e2e
```

El último comando necesita Chromium de Playwright (`npx playwright install chromium`) y el entorno Docker de desarrollo disponible en `http://localhost`. En la validación de esta fase, la suite también se ejecutó en la imagen oficial Playwright 1.64.1, conectada a un contenedor temporal de producción; no se recreó el stack activo.

## Limitaciones conocidas

- Los datos de métricas y acciones viven en memoria; recargar restaura los mocks. El listado de Usuarios y la matriz de permisos requieren API y token.
- El buscador global indexa los usuarios de `initialUsers` y publicaciones del catálogo mock. No incluye entidades agregadas en una sesión local.
- Exportar reporte, abrir perfiles reales, llamadas, adjuntos y el asistente de conexión permanecen como acciones informativas o simuladas.
- Ajustes de tema y densidad muestran su estado local; no rediseñan la apariencia en esta fase.
- El período personalizado limita el escalado de métricas a 365 días, aunque las etiquetas usan el rango elegido.
- `npm audit --omit=dev` reporta dos vulnerabilidades moderadas en `react-router` transitivo de `react-router-dom` 6.x; el aviso propone una actualización major a React Router 7. Se deja pendiente porque requiere migración y validación de compatibilidad.

El módulo Usuarios usa `/api/access/users` y `/api/access/users/:id/permissions` cuando hay token. Las vistas de negocio todavía no consumen APIs protegidas, por lo que la autorización de Fase 2 no se considera completa.
