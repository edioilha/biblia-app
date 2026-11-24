import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DADOS = join(import.meta.dirname, '../../public/dados/BLIVRE');
const BIBLIA_DATA = 'https://raw.githubusercontent.com/Projeto-Euaggelion/biblia.data/**';

/**
 * Simula o biblia.data (sem rede na CI): devolve os livros da BLIVRE no formato canônico,
 * com o texto marcado pela sigla ("[TB] No princípio…"). `falhar` responde 503.
 */
async function simularBibliaData(page: Page, { falhar = false } = {}) {
  await page.route(BIBLIA_DATA, async (rota) => {
    if (falhar) return rota.fulfill({ status: 503 });
    const [, sigla, livro] = /canonical\/(\w+)\/(\w+)\.json$/.exec(rota.request().url()) ?? [];
    const embarcado = JSON.parse(await readFile(join(DADOS, `${livro}.json`), 'utf-8')) as {
      capitulos: [number, string][][];
    };
    await rota.fulfill({
      json: {
        id: 0,
        code: livro,
        name: livro,
        abbrev: livro,
        chapters: embarcado.capitulos.map((versiculos, i) => ({
          number: i + 1,
          verses: versiculos.map(([number, text]) => ({ number, text: `[${sigla}] ${text}` })),
        })),
      },
    });
  });
}

async function abrirVersoes(page: Page) {
  await page.goto('./#/versoes');
  await expect(page.getByRole('radio', { name: /BLIVRE · Bíblia Livre/ })).toBeChecked({
    timeout: 30_000,
  });
}

test.describe('Versões (UC09/UC10)', () => {
  // Com o service worker no controle, o WebKit faz os fetch por ele e o page.route não os
  // vê (o teste baixaria do GitHub de verdade). O SW não guarda nada do biblia.data.
  test.use({ serviceWorkers: 'block' });

  test('instala a TB, lê nela em Jo 3 e volta para a BLIVRE no mesmo capítulo', async ({
    page,
  }) => {
    await simularBibliaData(page);
    await page.goto('./#/ler/JHN/3');
    await expect(page.locator('#v16')).toContainText('Porque Deus amou', { timeout: 30_000 });

    await page.getByRole('link', { name: 'Versões' }).click();
    await page.getByRole('button', { name: 'Instalar Tradução Brasileira' }).click();
    const tb = page.getByRole('radio', { name: /TB · Tradução Brasileira/ });
    await expect(tb).toBeVisible({ timeout: 30_000 });
    await tb.check();

    await page.getByRole('link', { name: 'Ler' }).click();
    await expect(page).toHaveURL(/#\/ler\/JHN\/3$/);
    await expect(page.locator('#v16')).toContainText('[TB] Porque Deus amou');
    await expect(page.getByTitle('Tradução Brasileira')).toHaveText('TB');

    // A preferência persiste: recarregar continua na TB.
    await page.reload();
    await expect(page.locator('#v16')).toContainText('[TB]', { timeout: 30_000 });

    await page.getByRole('link', { name: 'Versões' }).click();
    await page.getByRole('radio', { name: /BLIVRE · Bíblia Livre/ }).check();
    await page.getByRole('link', { name: 'Ler' }).click();
    await expect(page.locator('#v16')).not.toContainText('[TB]');
  });

  test('falha de rede: mostra o erro, nada fica instalado e dá para tentar de novo', async ({
    page,
  }) => {
    await simularBibliaData(page, { falhar: true });
    await abrirVersoes(page);
    await page.getByRole('button', { name: 'Instalar Almeida 1911' }).click();
    await expect(page.getByRole('alert')).toContainText('Não foi possível baixar a versão');

    await page.unrouteAll();
    await simularBibliaData(page);
    await page.getByRole('button', { name: 'Tentar instalar de novo Almeida 1911' }).click();
    await expect(page.getByRole('radio', { name: /ALM1911 · Almeida 1911/ })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('remove uma versão instalada com confirmação', async ({ page }) => {
    await simularBibliaData(page);
    await abrirVersoes(page);
    await page.getByRole('button', { name: 'Instalar Tradução Brasileira' }).click();
    await page.getByRole('button', { name: 'Remover Tradução Brasileira' }).click({
      timeout: 30_000,
    });
    await page
      .getByRole('dialog', { name: 'Remover Tradução Brasileira?' })
      .getByRole('button', { name: 'Remover versão' })
      .click();
    await expect(page.getByRole('button', { name: 'Instalar Tradução Brasileira' })).toBeVisible();
  });

  test('tela de Versões sem violações de acessibilidade (axe), durante a instalação', async ({
    page,
  }) => {
    // Segura a resposta: a tela fica com a barra de progresso e o Cancelar.
    await page.route(BIBLIA_DATA, () => undefined);
    await abrirVersoes(page);
    await page.getByRole('button', { name: 'Instalar Tradução Brasileira' }).click();
    await expect(page.getByRole('progressbar')).toBeVisible();

    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
