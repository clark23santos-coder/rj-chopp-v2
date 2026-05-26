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

async function preencherCampo(page: Page, seletor: string, valor: string) {
  const campo = page.locator(seletor).first();
  await expect(campo).toBeVisible();
  await campo.fill(valor);
}

test('criar produto e confirmar que salvou online', async ({ page }) => {
  await fazerLogin(page);

  const nomeProduto = `TESTE PLAYWRIGHT PRODUTO ${Date.now()}`;

  await page.getByRole('link', { name: /^Produtos$/i }).click();
  await expect(page.getByRole('heading', { name: /^Produtos$/, level: 1 })).toBeVisible();

  const busca = page.getByPlaceholder(/Pesquisar produto/i);
  if (await busca.isVisible()) {
    await busca.fill('');
  }

  await page.getByRole('button', { name: /^Novo Produto$/i }).click();

  await preencherCampo(page, 'input[placeholder="Nome do produto"], input[placeholder="Nome"], input[name="name"]', nomeProduto);
  await preencherCampo(page, 'input[placeholder="Categoria"], input[placeholder="Categoria do produto"], input[name="category"]', 'Chopp');
  await preencherCampo(page, 'input[placeholder="Marca"], input[placeholder="Marca do produto"], input[name="brand"]', 'TESTE');
  await preencherCampo(page, 'input[placeholder="Estoque"], input[placeholder="Quantidade em estoque"], input[name="stock"]', '10');
  await preencherCampo(page, 'input[placeholder="Estoque mínimo"], input[placeholder="Estoque minimo"], input[placeholder="Mínimo"], input[name="minStock"]', '2');
  await preencherCampo(page, 'input[placeholder="Custo"], input[placeholder="Valor de custo"], input[name="costPrice"]', '50');
  await preencherCampo(page, 'input[placeholder="Venda"], input[placeholder="Valor de venda"], input[name="salePrice"]', '100');

  await page.getByRole('button', { name: /salvar|cadastrar|criar/i }).click();

  await expect(page.getByRole('heading', { name: /^Produtos$/, level: 1 })).toBeVisible();

  if (await busca.isVisible()) {
    await busca.fill('');
  }

  await expect(page.getByText(nomeProduto)).toBeVisible({ timeout: 15000 });
});
