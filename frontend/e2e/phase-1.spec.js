import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 200, json: { userId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc08', email: 'admin@example.test', displayName: 'Sofía Ramírez', role: 'Administrador' } }));
  await page.route('**/api/access/users', (route) => route.fulfill({ status: 200, json: [{ UserId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc08', Email: 'sofia@example.test', DisplayName: 'Sofía Ramírez', Role: 'Administrador', IsActive: true, CreatedAt: '2026-01-01T00:00:00.000Z', InvitationStatus: 'Active' }] }));
  await page.route('**/api/access/assignment-options', (route) => route.fulfill({ status: 200, json: [] }));
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'No debe haber errores JavaScript ni errores de consola').toEqual([]);
});

test('navega a los once módulos desde el sidebar', async ({ page }) => {
  const entries = [
    ['Dashboard', '/'], ['Facebook', '/channels/facebook'], ['Instagram', '/channels/instagram'],
    ['TikTok', '/channels/tiktok'], ['Comparación', '/comparison'], ['Reportes', '/reports'],
    ['Inteligencia Artificial', '/ai'], ['WhatsApp', '/whatsapp'], ['Conexiones', '/connections'],
    ['Usuarios', '/users'], ['Ajustes', '/settings'],
  ];
  await page.goto('/');
  for (const [label, path] of entries.slice(1)) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}\\/?$`));
    await expect(page.locator('main h1').first()).toBeVisible();
  }
});

test('Nginx de producción sirve una ruta profunda y sus recursos estáticos', async ({ page }) => {
  const failedResources = [];
  page.on('response', (response) => {
    if (['script', 'stylesheet', 'image'].includes(response.request().resourceType()) && response.status() >= 400) {
      failedResources.push(`${response.status()} ${response.url()}`);
    }
  });
  const response = await page.goto('/channels/instagram');
  expect(response?.status()).toBe(200);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('.channel-title')).toContainText('Instagram');
  expect(failedResources).toEqual([]);
});

test('busca módulos, usuarios y publicaciones y navega al resultado', async ({ page }) => {
  await page.goto('/');
  const search = async (term) => {
    await page.getByRole('button', { name: 'Buscar' }).click();
    const input = page.getByRole('textbox', { name: 'Buscar módulos, usuarios y publicaciones' });
    await input.fill(term);
  };

  await search('Instagram');
  await page.getByRole('option').filter({ hasText: 'Módulo' }).first().click();
  await expect(page).toHaveURL(/\/channels\/instagram$/);

  await search('Sofía Ramírez');
  await page.getByRole('option').filter({ hasText: 'Usuario' }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByPlaceholder('Buscar usuario')).toHaveValue('Sofía Ramírez');

  await search('Pequeños momentos');
  await page.getByRole('option').filter({ hasText: 'Publicación' }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole('textbox', { name: 'Buscar publicaciones' })).toHaveValue('Pequeños momentos, grandes historias ✨');
});

test('aplica presets, rechaza rangos inválidos y permite un rango de un día', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Últimos 30 días/ }).click();
  await page.getByRole('button', { name: 'Últimos 7 días' }).click();
  await expect(page.getByRole('button', { name: /Últimos 7 días/ })).toBeVisible();
  await page.getByRole('button', { name: /Últimos 7 días/ }).click();
  await page.getByRole('button', { name: 'Personalizado' }).click();
  const from = page.getByLabel('Fecha inicial');
  const to = page.getByLabel('Fecha final');
  await from.fill('2026-10-25');
  await to.fill('2026-10-20');
  await expect(page.getByRole('alert')).toContainText('anterior o igual');
  await expect(page.getByRole('button', { name: 'Aplicar período' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '1 oct — 31 oct' })).toBeVisible();

  await from.fill('2026-10-21');
  await to.fill('2026-10-21');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Aplicar período' }).click();
  await expect(page.getByRole('button', { name: '21 oct' })).toBeVisible();
  await expect(page.locator('.followers-card .recharts-dot')).toHaveCount(3);
});

test('pagina y filtra la tabla de publicaciones; reinicia la página al filtrar', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByLabel('Filas por página').selectOption('3');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.getByLabel('Filas por página').selectOption('5');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.getByLabel('Filtrar por canal').selectOption('instagram');
  await expect(page.getByText('Página 1 de 1')).toBeVisible();
  await expect(page.locator('.report-table tbody tr')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
});

test('busca, pagina, edita y desactiva usuarios localmente', async ({ page }) => {
  await page.goto('/users');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Mateo Cruz')).toBeVisible();
  await page.getByLabel('Filas por página').selectOption('5');
  await expect(page.getByText('Página 1 de 1')).toBeVisible();
  await page.getByPlaceholder('Buscar usuario').fill('Sofía');
  await expect(page.getByText('Página 1 de 1')).toBeVisible();
  await page.getByRole('button', { name: 'Acciones de Sofía Ramírez' }).click();
  await page.getByRole('button', { name: 'Editar información' }).click();
  await page.getByPlaceholder('Ej. Andrea López').fill('Sofía Auditada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Sofía Auditada')).toBeVisible();
  await page.getByRole('button', { name: 'Acciones de Sofía Auditada' }).click();
  await page.getByRole('button', { name: 'Desactivar usuario' }).click();
  await expect(page.getByText('Inactivo')).toBeVisible();
});

test('conecta y desconecta un canal localmente', async ({ page }) => {
  await page.goto('/connections');
  const whatsappCard = page.locator('.connection-card').filter({ hasText: 'WhatsApp' });
  await expect(whatsappCard.getByText('Desconectado')).toBeVisible();
  await whatsappCard.getByRole('button', { name: 'Conectar' }).click();
  await expect(whatsappCard.getByText('Conectado')).toBeVisible();
  await whatsappCard.getByRole('button', { name: 'Desconectar' }).click();
  await expect(whatsappCard.getByText('Desconectado')).toBeVisible();
  await page.getByRole('button', { name: 'Actualizar estados' }).click();
  await expect(page.getByRole('status')).toContainText('fechas de sincronización');
  await page.getByRole('button', { name: 'Agregar conexión' }).click();
  await expect(page.getByRole('status')).toContainText('fase futura');
});

test('permite explorar y enviar mensajes simulados en WhatsApp', async ({ page }) => {
  await page.goto('/whatsapp');
  await page.getByPlaceholder('Buscar conversación').fill('Carlos');
  await page.getByRole('button', { name: /Carlos López/ }).click();
  await expect(page.locator('.thread-heading')).toContainText('Carlos López');
  await page.getByRole('button', { name: 'Llamar' }).click();
  await expect(page.getByRole('status')).toContainText('no se realizan');
  await page.getByRole('button', { name: 'Cerrar' }).click();
  await page.getByRole('button', { name: 'Adjuntar archivo' }).click();
  await expect(page.getByRole('status')).toContainText('no se cargan');
  await page.getByRole('button', { name: 'Cerrar' }).click();
  await page.getByRole('button', { name: 'Insertar emoji' }).click();
  await expect(page.getByPlaceholder(/Escribe un mensaje de demostración/)).toHaveValue('😊');
  await page.getByPlaceholder(/Escribe un mensaje de demostración/).fill('Prueba local');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Prueba local')).toBeVisible();
});

test('los controles de perfil, notificaciones, perfiles de canal y vista general responden', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Notificaciones' }).click();
  await page.getByRole('button', { name: 'Marcar leídas' }).click();
  await expect(page.locator('.notification-button i')).toHaveCount(0);
  await page.getByRole('button', { name: /Sofía Ramírez/ }).click();
  await page.getByRole('button', { name: 'Preferencias' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toContainText('Preferencias simuladas guardadas');
  await page.goto('/channels/facebook');
  await page.getByRole('button', { name: 'Abrir perfil' }).click();
  await expect(page.getByRole('status')).toContainText('no se abre una cuenta real');
  await page.goto('/comparison');
  await page.getByRole('button', { name: 'Vista general' }).click();
  await expect(page.getByRole('status')).toContainText('Vista general');
});

test('responde con el mock conversacional y expande el historial de IA', async ({ page }) => {
  await page.goto('/ai');
  await page.getByRole('button', { name: '¿Qué contenido funcionó mejor?' }).click();
  await expect(page.getByText('Según los datos de demostración', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByText('Tendencias de audiencia')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver menos' })).toBeVisible();
});

test('abre el menú móvil y permite navegar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await expect(page.locator('.sidebar')).toHaveClass(/sidebar-mobile-open/);
  await page.getByRole('link', { name: 'Instagram', exact: true }).click();
  await expect(page).toHaveURL(/\/channels\/instagram$/);
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-mobile-open/);
});

test('el buscador global también está disponible con viewport móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('textbox', { name: 'Buscar módulos, usuarios y publicaciones' }).fill('TikTok');
  await page.getByRole('option').filter({ hasText: 'Módulo' }).click();
  await expect(page).toHaveURL(/\/channels\/tiktok$/);
});

test('renderiza paths de Recharts con geometría tras la animación', async ({ page }) => {
  await page.goto('/');
  const path = page.locator('.recharts-line-curve').first();
  await expect(path).toBeAttached();
  await expect.poll(async () => (await path.getAttribute('d'))?.length || 0).toBeGreaterThan(20);
  await page.waitForTimeout(2200);
  await expect(path).toBeVisible();
  expect(await path.getAttribute('stroke')).toMatch(/^#/);
  await expect.poll(async () => {
    const dash = await path.getAttribute('stroke-dasharray');
    return dash === null || !dash.startsWith('0px');
  }).toBe(true);
});
