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

test('testar todas as telas do menu', async ({ page }) => {
  await fazerLogin(page);

  const telas = [
    'Dashboard',
    'Produtos',
    'Estoque',
    'Pedidos',
    'Clientes',
    'Mapa',
    'Financeiro',
    'Despesas',
    'Contas a Receber',
    'Retiradas',
    'Relatórios',
    'Histórico',
    'Configurações',
    'Backup',
  ];

  for (const tela of telas) {
    await page.getByRole('link', { name: new RegExp(`^${tela}$`, 'i') }).click();
    await expect(page.getByRole('heading', { name: new RegExp(`^${tela}$`, 'i'), level: 1 })).toBeVisible();
  }
});
