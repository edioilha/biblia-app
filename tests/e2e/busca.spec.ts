import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const campo = (page: Page) => page.getByRole('searchbox', { name: 'Buscar na Bíblia' });
const status = (page: Page) => page.getByRole('status').first();
const resultados = (page: Page) => page.getByRole('list', { name: 'Versículos encontrados' });

test.describe('Busca (UC03)', () => {
  test.beforeEach(async ({ page }) => {
    // Primeira visita importa a versão; o índice é montado no Web Worker.
    await page.goto('./#/buscar');
    await expect(campo(page)).toBeVisible({ timeout: 30_000 });
  });

  test('busca enquanto digita, abre o versículo e volta à mesma busca', async ({ page }) => {
    await campo(page).fill('unigênito');
    await expect(status(page)).toHaveText(/\d+ versículos encontrados · página 1 de \d+/, {
      timeout: 30_000,
    });
    const joao = resultados(page).getByRole('link', { name: /^João 3:16/ });
    await expect(joao.locator('mark')).toHaveText('unigênito');

    await joao.click();
    await expect(page).toHaveURL(/#\/ler\/JHN\/3\/16$/);
    await expect(page.locator('#v16')).toHaveClass(/versiculo-foco/);

    await page.goBack();
    await expect(campo(page)).toHaveValue('unigênito');
    await expect(resultados(page).getByRole('link', { name: /^João 3:16/ })).toBeVisible();
  });

  test('frase exata, filtro de testamento e paginação', async ({ page }) => {
    await campo(page).fill('"luz do mundo"');
    await expect(status(page)).toHaveText(/encontrado/, { timeout: 30_000 });
    await expect(page.getByRole('radio', { name: /Frase exata/ })).toBeChecked();
    for (const marca of await resultados(page).locator('mark').all()) {
      await expect(marca).toHaveText(/^luz do mundo$/i);
    }

    await campo(page).fill('senhor');
    await page.getByText('NT', { exact: true }).click();
    await expect(page).toHaveURL(/t=NT/);
    await expect(status(page)).toHaveText(/página 1 de (\d+)/);
    await expect(resultados(page).getByRole('link').first()).not.toHaveText(/^(Gênesis|Salmos)/);

    await page.getByRole('button', { name: 'Próxima página' }).click();
    await expect(status(page)).toHaveText(/página 2 de/);
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('primeira página em menos de 500 ms com o índice pronto (RNF02)', async ({ page }) => {
    await campo(page).fill('amor');
    await expect(status(page)).toHaveText(/encontrados/, { timeout: 30_000 }); // índice pronto

    const anterior = await status(page).textContent();
    const inicio = Date.now();
    await page.evaluate(() => {
      location.hash = '#/buscar?q=deus';
    });
    await expect(status(page)).not.toHaveText(anterior ?? '');
    await expect(resultados(page)).toHaveAttribute('aria-busy', 'false');
    const ms = Date.now() - inicio;
    test.info().annotations.push({ type: 'RNF02', description: `1ª página: ${ms} ms` });
    expect(ms).toBeLessThan(500);
  });

  test('não tem violações de acessibilidade com resultados', async ({ page }) => {
    await campo(page).fill('amor de Deus');
    await expect(status(page)).toHaveText(/encontrados/, { timeout: 30_000 });
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
