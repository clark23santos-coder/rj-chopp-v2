import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://rj-chopp-v2-jznf.vercel.app';

test.setTimeout(60000);

async function fazerLogin(page: Page) {
  const usuario = process.env.RJCHOPP_USER;
  const senha = process.env.RJCHOPP_PASS;

  if (!usuario || !senha) {
    throw new Error('Faltou informar usuario ou senha do teste.');
  }

  await page.goto(SITE_URL);

  await expect(page.getByRole('heading', { name: /^Entrar$/ })).toBeVisible();

  await page.getByPlaceholder('Digite seu usuário').fill(usuario);
  await page.getByPlaceholder('Digite sua senha').fill(senha);
  await page.getByRole('button', { name: /^Entrar no sistema$/i }).click();

  await expect(page.getByRole('heading', { name: /^Dashboard$/, level: 1 })).toBeVisible();
}

async function abrirTela(page: Page, nome: string) {
  await page.getByRole('link', { name: new RegExp(`^${nome}$`, 'i') }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`^${nome}$`, 'i'), level: 1 })).toBeVisible();
}

test('bateria geral do sistema RJ Chopp SGE', async ({ page }) => {
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
    await abrirTela(page, tela);
  }

  await abrirTela(page, 'Produtos');
  await expect(page.getByRole('button', { name: /^Novo Produto$/i })).toBeVisible();

  await abrirTela(page, 'Estoque');
  await expect(page.getByRole('button', { name: /^Nova Movimentação$/i })).toBeVisible();

  await abrirTela(page, 'Pedidos');
  await expect(page.getByRole('button', { name: /^Novo Pedido$/i })).toBeVisible();

  await abrirTela(page, 'Clientes');
  await expect(page.getByRole('button', { name: /^Novo Cliente$/i })).toBeVisible();

  await abrirTela(page, 'Despesas');
  await expect(page.getByRole('button', { name: /^Adicionar Despesa$/i })).toBeVisible();
});
