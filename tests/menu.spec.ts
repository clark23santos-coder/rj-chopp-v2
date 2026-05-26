import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://rj-chopp-v2-jznf.vercel.app';

async function fazerLogin(page: Page) {
  const usuario = process.env.RJCHOPP_USER;
  const senha = process.env.RJCHOPP_PASS;

  if (!usuario || !senha) {
    throw new Error('Faltou informar usuario ou senha do teste.');
  }

  await page.goto(SITE_URL);

  await page.getByPlaceholder('Digite seu usuário').fill(usuario);
  await page.getByPlaceholder('Digite sua senha').fill(senha);
  await page.getByRole('button', { name: /entrar no sistema/i }).click();

  await expect(page.getByRole('heading', { name: /^Dashboard$/, level: 1 })).toBeVisible();
}

test('testar menu principal do sistema', async ({ page }) => {
  await fazerLogin(page);

  await page.getByRole('link', { name: /^Dashboard$/i }).click();
  await expect(page.getByRole('heading', { name: /^Dashboard$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Produtos$/i }).click();
  await expect(page.getByRole('heading', { name: /^Produtos$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Estoque$/i }).click();
  await expect(page.getByRole('heading', { name: /^Estoque$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Pedidos$/i }).click();
  await expect(page.getByRole('heading', { name: /^Pedidos$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Clientes$/i }).click();
  await expect(page.getByRole('heading', { name: /^Clientes$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Mapa$/i }).click();
  await expect(page.getByRole('heading', { name: /^Mapa$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Financeiro$/i }).click();
  await expect(page.getByRole('heading', { name: /^Financeiro$/, level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /^Despesas$/i }).click();
  await expect(page.getByRole('heading', { name: /^Despesas$/, level: 1 })).toBeVisible();
});
