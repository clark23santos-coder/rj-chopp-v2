import { test, expect } from '@playwright/test';

test('login e acesso ao dashboard', async ({ page }) => {
  const usuario = process.env.RJCHOPP_USER;
  const senha = process.env.RJCHOPP_PASS;

  if (!usuario || !senha) {
    throw new Error('Faltou informar usuario ou senha do teste.');
  }

  await page.goto('https://rj-chopp-v2-jznf.vercel.app');

  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

  await page.getByPlaceholder('Digite seu usuário').fill(usuario);
  await page.getByPlaceholder('Digite sua senha').fill(senha);

  await page.getByRole('button', { name: /entrar no sistema/i }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Produtos/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Clientes/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pedidos/i })).toBeVisible();
});
