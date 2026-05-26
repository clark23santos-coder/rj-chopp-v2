import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://rj-chopp-v2-jznf.vercel.app';

test.setTimeout(180000);

function textoParaRegex(texto: string) {
  return new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

async function fazerLogin(page: Page) {
  const usuario = process.env.RJCHOPP_USER;
  const senha = process.env.RJCHOPP_PASS;

  if (!usuario || !senha) {
    throw new Error('Faltou informar usuário ou senha do teste.');
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

async function preencherCampo(page: Page, seletor: string, valor: string) {
  const campo = page.locator(seletor).first();
  await expect(campo).toBeVisible({ timeout: 15000 });
  await campo.fill(valor);
}

async function clicarPrimeiroBotao(page: Page, nome: RegExp) {
  const botao = page.getByRole('button', { name: nome }).first();
  await expect(botao).toBeVisible({ timeout: 15000 });
  await botao.click();
}

async function limparBuscaProduto(page: Page) {
  const busca = page.getByPlaceholder(/Pesquisar produto/i);
  if (await busca.isVisible()) {
    await busca.fill('');
  }
}

async function limparBuscaCliente(page: Page) {
  const busca = page.getByPlaceholder(/Pesquisar cliente/i);
  if (await busca.isVisible()) {
    await busca.fill('');
  }
}

async function pesquisarCliente(page: Page, texto: string) {
  const busca = page.getByPlaceholder(/Pesquisar cliente/i);
  await expect(busca).toBeVisible({ timeout: 15000 });
  await busca.fill(texto);
}

test('teste cabo a rabo do sistema RJ Chopp SGE', async ({ page }) => {
  await fazerLogin(page);

  const agora = Date.now();

  const nomeProduto = `TESTE PLAYWRIGHT PRODUTO ${agora}`;
  const nomeProdutoEditado = `${nomeProduto} EDITADO`;

  const nomeCliente = `TESTE PLAYWRIGHT CLIENTE ${agora}`;
  const nomeClienteEditado = `${nomeCliente} EDITADO`;

  const nomeDespesa = `TESTE PLAYWRIGHT DESPESA ${agora}`;

  await test.step('abrir todas as telas do menu', async () => {
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
  });

  await test.step('criar produto online', async () => {
    await abrirTela(page, 'Produtos');
    await limparBuscaProduto(page);

    await clicarPrimeiroBotao(page, /^Novo Produto$/i);

    await preencherCampo(page, 'input[placeholder="Nome do produto"], input[placeholder="Nome"], input[name="name"]', nomeProduto);
    await preencherCampo(page, 'input[placeholder="Categoria"], input[placeholder="Categoria do produto"], input[name="category"]', 'Chopp');
    await preencherCampo(page, 'input[placeholder="Marca"], input[placeholder="Marca do produto"], input[name="brand"]', 'TESTE');
    await preencherCampo(page, 'input[placeholder="Estoque"], input[placeholder="Quantidade em estoque"], input[name="stock"]', '10');
    await preencherCampo(page, 'input[placeholder="Estoque mínimo"], input[placeholder="Estoque minimo"], input[placeholder="Mínimo"], input[name="minStock"]', '2');
    await preencherCampo(page, 'input[placeholder="Custo"], input[placeholder="Valor de custo"], input[name="costPrice"]', '50');
    await preencherCampo(page, 'input[placeholder="Venda"], input[placeholder="Valor de venda"], input[name="salePrice"]', '100');

    await clicarPrimeiroBotao(page, /^Salvar Produto$|^Salvar$|^Cadastrar Produto$|^Criar Produto$/i);

    await expect(page.getByText(nomeProduto)).toBeVisible({ timeout: 20000 });
  });

  await test.step('editar produto online', async () => {
    await abrirTela(page, 'Produtos');
    await limparBuscaProduto(page);

    const linhaProduto = page.getByRole('row', { name: textoParaRegex(nomeProduto) });
    await expect(linhaProduto).toBeVisible({ timeout: 20000 });

    await linhaProduto.getByRole('button', { name: /editar produto/i }).click();

    await preencherCampo(page, 'input[placeholder="Nome do produto"], input[placeholder="Nome"], input[name="name"]', nomeProdutoEditado);

    await clicarPrimeiroBotao(page, /^Salvar Produto$|^Salvar$|^Atualizar Produto$|^Atualizar$/i);

    await abrirTela(page, 'Produtos');
    await limparBuscaProduto(page);

    await expect(page.getByText(nomeProdutoEditado)).toBeVisible({ timeout: 20000 });
  });

  await test.step('criar cliente online', async () => {
    await abrirTela(page, 'Clientes');
    await limparBuscaCliente(page);

    await clicarPrimeiroBotao(page, /^Novo Cliente$/i);

    await preencherCampo(page, 'input[placeholder="Nome"], input[placeholder="Nome do cliente"], input[name="name"]', nomeCliente);
    await preencherCampo(page, 'input[placeholder="Telefone"], input[placeholder="WhatsApp"], input[name="phone"]', '44999999999');
    await preencherCampo(page, 'input[placeholder="Email"], input[name="email"]', `teste${agora}@playwright.com`);
    await preencherCampo(page, 'input[placeholder="Endereço"], input[placeholder="Endereco"], input[placeholder="Endereço completo"], input[name="address"]', 'Rua Teste Playwright 123');

    await clicarPrimeiroBotao(page, /^Salvar Cliente$|^Salvar$|^Cadastrar Cliente$|^Criar Cliente$/i);

    await expect(page.getByText(nomeCliente)).toBeVisible({ timeout: 20000 });
  });

  await test.step('editar cliente online', async () => {
    await abrirTela(page, 'Clientes');

    await pesquisarCliente(page, nomeCliente);

    await expect(page.getByRole('heading', { name: textoParaRegex(nomeCliente) })).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /editar cliente/i }).first().click();

    await preencherCampo(page, 'input[placeholder="Nome"], input[placeholder="Nome do cliente"], input[name="name"]', nomeClienteEditado);

    await clicarPrimeiroBotao(page, /^Salvar Cliente$|^Salvar$|^Atualizar Cliente$|^Atualizar$/i);

    await limparBuscaCliente(page);

    await expect(page.getByText(nomeClienteEditado)).toBeVisible({ timeout: 20000 });
  });

  await test.step('criar despesa online', async () => {
    await abrirTela(page, 'Despesas');

    await clicarPrimeiroBotao(page, /^Adicionar Despesa$/i);

    await preencherCampo(page, 'input[placeholder="O que foi gasto"], input[placeholder="Descrição"], input[placeholder="Descricao"], input[name="description"]', nomeDespesa);
    await preencherCampo(page, 'input[placeholder="Categoria"], input[name="category"]', 'Teste');
    await preencherCampo(page, 'input[placeholder="Valor"], input[name="amount"], input[type="number"]', '25');

    const data = page.locator('input[type="date"]').first();
    if (await data.isVisible()) {
      await data.fill('2026-05-26');
    }

    await page.locator('div.fixed').getByRole('button', { name: /^Salvar Despesa$|^Adicionar Despesa$|^Salvar$|^Cadastrar Despesa$|^Criar Despesa$/i }).click();

    await expect(page.getByText(nomeDespesa)).toBeVisible({ timeout: 20000 });
  });

  await test.step('conferir telas finais depois dos cadastros', async () => {
    await abrirTela(page, 'Produtos');
    await limparBuscaProduto(page);
    await expect(page.getByText(nomeProdutoEditado)).toBeVisible({ timeout: 20000 });

    await abrirTela(page, 'Clientes');
    await limparBuscaCliente(page);
    await expect(page.getByText(nomeClienteEditado)).toBeVisible({ timeout: 20000 });

    await abrirTela(page, 'Despesas');
    await expect(page.getByText(nomeDespesa)).toBeVisible({ timeout: 20000 });

    await abrirTela(page, 'Pedidos');
    await expect(page.getByRole('button', { name: /^Novo Pedido$/i })).toBeVisible();

    await abrirTela(page, 'Mapa');
    await abrirTela(page, 'Retiradas');
    await abrirTela(page, 'Financeiro');
    await abrirTela(page, 'Contas a Receber');
    await abrirTela(page, 'Relatórios');
    await abrirTela(page, 'Histórico');
    await abrirTela(page, 'Configurações');
    await abrirTela(page, 'Backup');
  });
});
