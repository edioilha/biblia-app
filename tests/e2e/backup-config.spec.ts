import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });
const numero = (page: Page, n: number, favorito = false) =>
  page.getByRole('button', { name: `Versículo ${n}${favorito ? ', favorito' : ''}`, exact: true });
const acoes = (page: Page) => page.getByRole('region', { name: /^Ações do versículo/ });

async function abrirJo3(page: Page) {
  await page.goto('./#/ler/JHN/3');
  await expect(tituloCapitulo(page)).toContainText('João', { timeout: 30_000 });
}

async function semViolacoes(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(resultado.violations).toEqual([]);
}

test.describe('Backup (UC11)', () => {
  test('exporta, perde um favorito e o recupera importando o arquivo', async ({ page }) => {
    await abrirJo3(page);
    await numero(page, 16).click();
    await acoes(page)
      .getByRole('button', { name: /Favoritar/ })
      .click();
    await expect(numero(page, 16, true)).toBeVisible();

    await page.getByRole('link', { name: 'Meus Estudos' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar backup' }).click();
    const arquivo = await (await download).path();
    expect((await download).suggestedFilename()).toMatch(
      /^biblia-app-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );

    // Remove o favorito e importa o backup: ele volta.
    await page.getByRole('button', { name: /Ações de João 3:16/ }).click();
    await page.getByRole('menuitem', { name: 'Remover dos favoritos' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remover favorito' }).click();
    await expect(page.getByRole('link', { name: /João 3:16/ })).toHaveCount(0);

    await page.getByLabel('Arquivo de backup').setInputFiles(arquivo);
    const previa = page.getByRole('dialog', { name: 'Importar backup?' });
    await expect(previa).toContainText('1 novo');
    await semViolacoes(page);
    await previa.getByRole('button', { name: 'Importar' }).click();
    await page
      .getByRole('dialog', { name: 'Backup importado' })
      .getByRole('button', { name: 'Fechar' })
      .click();
    await expect(page.getByRole('link', { name: /João 3:16/ })).toBeVisible();
  });
});

test.describe('Configurar leitura (UC12)', () => {
  test('A+ aumenta o texto e a escolha fica salva', async ({ page }) => {
    await abrirJo3(page);
    const texto = page.locator('.texto-biblico');
    const antes = await texto.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    await page.getByRole('button', { name: 'Aparência da leitura' }).click();
    await page.getByRole('button', { name: 'Aumentar o texto' }).click();
    await page.getByRole('button', { name: 'Aumentar o texto' }).click();
    await expect(page.getByText('5 de 7')).toBeVisible();
    await semViolacoes(page);

    await page.reload();
    await expect(tituloCapitulo(page)).toBeVisible({ timeout: 30_000 });
    const depois = await texto.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(depois).toBeCloseTo(antes * 1.25, 0);
  });

  for (const tema of ['Sépia', 'Escuro'] as const) {
    test(`tema ${tema}: vale para o app inteiro, sem violações de contraste`, async ({ page }) => {
      await abrirJo3(page);
      await page.getByRole('button', { name: 'Aparência da leitura' }).click();
      // O rádio é visualmente oculto: clica-se na amostra (o rótulo), como o leitor.
      await page.getByRole('group', { name: 'Tema' }).getByText(tema, { exact: true }).click();
      await expect(page.getByRole('radio', { name: tema })).toBeChecked();
      await page.keyboard.press('Escape');
      const valor = tema === 'Sépia' ? 'SEPIA' : 'ESCURO';
      await expect(page.locator('html')).toHaveAttribute('data-tema', valor);
      await semViolacoes(page);

      // Aplicado antes do React ao reabrir (sem piscar o claro).
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-tema', valor);

      for (const secao of ['Buscar', 'Planos', 'Meus Estudos', 'Versões']) {
        await page.getByRole('link', { name: secao }).click();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByRole('link', { name: secao })).toHaveAttribute(
          'aria-current',
          'page',
        );
        await semViolacoes(page);
      }
    });
  }

  test('largura da página: só em telas a partir de 768 px, e fica salva (BL-01)', async ({
    page,
  }) => {
    await abrirJo3(page);
    const pagina = page.locator('article.pagina-papel');
    const largura = () => pagina.evaluate((el) => el.getBoundingClientRect().width);
    const janela = page.viewportSize()?.width ?? 0;
    await page.getByRole('button', { name: 'Aparência da leitura' }).click();
    const grupo = page.getByRole('group', { name: 'Largura da página' });

    if (janela < 768) {
      // No celular a opção some e a página continua ocupando a tela.
      await expect(grupo).toBeHidden();
      return;
    }

    expect(await largura()).toBeCloseTo(672, 0);
    await grupo.getByText('Larga', { exact: true }).click();
    await expect(grupo.getByRole('radio', { name: 'Larga' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-largura', 'LARGA');
    await expect.poll(largura).toBeCloseTo(Math.min(896, janela), 0);
    await semViolacoes(page);

    // Aplicada antes do React ao reabrir (a página não pula de largura).
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-largura', 'LARGA');
    await expect(tituloCapitulo(page)).toBeVisible({ timeout: 30_000 });
    expect(await largura()).toBeCloseTo(896, 0);
    const rolagem = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(rolagem).toBe(true);
  });

  test('fonte e folha da página: valem na hora e ficam salvas (BL-02, BL-03)', async ({ page }) => {
    await abrirJo3(page);
    const pagina = page.locator('article.pagina-papel');
    await page.getByRole('button', { name: 'Aparência da leitura' }).click();

    // Legível: a Atkinson Hyperlegible embarcada (servida pelo próprio site, sem rede).
    await page.getByRole('group', { name: 'Fonte' }).getByText('Legível', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-fonte', 'LEGIVEL');
    await expect(pagina).toHaveCSS('font-family', /^"?Atkinson Hyperlegible/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.fonts].some(
            (f) => f.family.includes('Atkinson Hyperlegible') && f.status === 'loaded',
          ),
        ),
      )
      .toBe(true);

    // Pautada: uma linha por linha de texto, em cada parágrafo.
    await page.getByRole('group', { name: 'Folha' }).getByText('Pautada', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-folha', 'PAUTADO');
    const pauta = await page
      .locator('.texto-biblico > p')
      .first()
      .evaluate((el) => {
        const estilo = getComputedStyle(el);
        const [largura, altura] = estilo.backgroundSize.split(' ');
        return { largura, altura: parseFloat(altura ?? ''), linha: parseFloat(estilo.lineHeight) };
      });
    // Linha em pixels inteiros: a pauta e o texto têm exatamente o mesmo passo.
    expect(pauta.largura).toBe('100%');
    expect(Number.isInteger(pauta.linha)).toBe(true);
    expect(pauta.altura).toBe(pauta.linha);
    await page.keyboard.press('Escape');
    await semViolacoes(page);

    // Aplicadas antes do React ao reabrir.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-fonte', 'LEGIVEL');
    await expect(page.locator('html')).toHaveAttribute('data-folha', 'PAUTADO');
    await expect(tituloCapitulo(page)).toBeVisible({ timeout: 30_000 });
  });
});
