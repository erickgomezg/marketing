import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 200, json: {
    userId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc08',
    email: 'admin@example.test',
    displayName: 'Administrador de pruebas',
    role: 'Administrador',
  } }));
  await page.route('**/api/access/users', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/access/assignment-options', (route) => route.fulfill({ status: 200, json: [] }));
});

test('navega por los módulos sin mostrar información ficticia', async ({ page }) => {
  const entries = [
    ['Facebook', '/channels/facebook'], ['Instagram', '/channels/instagram'],
    ['TikTok', '/channels/tiktok'], ['Comparación', '/comparison'], ['Reportes', '/reports'],
    ['Inteligencia Artificial', '/ai'], ['WhatsApp', '/whatsapp'], ['Conexiones', '/connections'],
    ['Usuarios', '/users'], ['Ajustes', '/settings'],
  ];
  await page.goto('/');
  await expect(page.getByText('Todavía no hay datos reales')).toBeVisible();
  for (const [label, path] of entries) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}\\/?$`));
    await expect(page.locator('main h1').first()).toBeVisible();
  }
});

test('dashboard y canales muestran estado vacío hasta recibir datos reales', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Todavía no hay datos reales')).toBeVisible();
  await expect(page.locator('.kpi-card')).toHaveCount(0);
  await page.goto('/channels/instagram');
  await expect(page.getByText('Sin cuenta conectada')).toBeVisible();
  await expect(page.getByText(/No se muestran datos de demostración/)).toBeVisible();
});

test('reportes, comparación e IA no fabrican métricas ni recomendaciones', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.getByText('No hay reportes disponibles')).toBeVisible();
  await page.goto('/comparison');
  await expect(page.getByText('Aún no hay información para comparar')).toBeVisible();
  await page.goto('/ai');
  await expect(page.getByText('La IA todavía no tiene datos para analizar')).toBeVisible();
});

test('conexiones no se marcan conectadas sin confirmación del servidor', async ({ page }) => {
  await page.goto('/connections');
  await expect(page.getByText('Sin conectar').first()).toBeVisible();
  await expect(page.getByText('Estado verificado')).toBeVisible();
  await expect(page.getByText(/Amor Studio|5555 0198|3 de 4 canales activos/)).toHaveCount(0);
});

test('WhatsApp no muestra conversaciones ni número ficticio', async ({ page }) => {
  await page.goto('/whatsapp');
  await expect(page.getByText('WhatsApp no está conectado')).toBeVisible();
  await expect(page.getByText(/5555|Ana Martínez|Carlos López/)).toHaveCount(0);
});

test('usuarios se consultan desde el backend y el estado vacío es explícito', async ({ page }) => {
  await page.goto('/users');
  await expect(page.getByText('0 usuarios')).toBeVisible();
  await expect(page.getByText('No encontramos usuarios con ese nombre.')).toBeVisible();
});
