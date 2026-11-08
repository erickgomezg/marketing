import { expect, test } from '@playwright/test';

test('anonymous visitor can sign in and sees the administrator dashboard', async ({ page }) => {
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 401, json: { error: 'Autenticación requerida' } }));
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    headers: { 'Set-Cookie': 'amm_access=mock-session; HttpOnly; SameSite=Lax; Path=/' },
    json: { user: { userId: '65ab32dc-162f-4f50-b9b5-8f6c8719cc08', email: 'admin@example.test', displayName: 'Admin Pruebas', role: 'Administrador' } },
  }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await page.getByLabel('Correo electrónico').fill('admin@example.test');
  await page.getByLabel('Contraseña').fill('synthetic-test-password');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Buenos días, Sofía' })).toBeVisible();
  await expect(page.getByText('Admin Pruebas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
});

test('wrong credentials show the generic login error and keep the session closed', async ({ page }) => {
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 401, json: { error: 'Autenticación requerida' } }));
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401, json: { error: 'Correo o contraseña incorrectos.' } }));
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('admin@example.test');
  await page.getByLabel('Contraseña').fill('incorrect');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos.');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});

test('a valid invitation activates the account through the public flow', async ({ page }) => {
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 401, json: { error: 'Autenticación requerida' } }));
  await page.route('**/api/auth/invitation/validate', (route) => route.fulfill({ status: 200, json: { valid: true, displayName: 'Viewer Sintético', email: 'viewer@example.test', role: 'Viewer' } }));
  await page.route('**/api/auth/invitation/accept', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/accept-invitation?token=synthetic-invitation-token-12345678901234567890');
  await expect(page.getByText(/Viewer Sintético/)).toBeVisible();
  await page.getByLabel('Nueva contraseña').fill('Synthetic-Password-2026');
  await page.getByLabel('Confirmar contraseña').fill('Synthetic-Password-2026');
  await page.getByRole('button', { name: 'Activar cuenta' }).click();
  await expect(page.getByRole('status')).toContainText('Cuenta activada');
});

test('password recovery returns a generic success message', async ({ page }) => {
  await page.route('**/api/access/me', (route) => route.fulfill({ status: 401, json: { error: 'Autenticación requerida' } }));
  await page.route('**/api/auth/forgot-password', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.email).toBe('viewer@example.test');
    await route.fulfill({ status: 202, json: { message: 'Si la cuenta puede recuperar el acceso, recibirá instrucciones por correo.' } });
  });
  await page.goto('/forgot-password');
  await page.getByLabel('Correo electrónico').fill('viewer@example.test');
  await page.getByRole('button', { name: 'Enviar instrucciones' }).click();
  await expect(page.getByRole('status')).toContainText('Si la cuenta puede recuperar el acceso');
});
