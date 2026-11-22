import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });

test.describe('Leitura (UC01/UC02)', () => {
  test('primeira execução prepara a BLIVRE e abre Gênesis 1', async ({ page }) => {
    await page.goto('./');
    await expect(tituloCapitulo(page)).toContainText('Capítulo 1', { timeout: 30_000 });
    await expect(tituloCapitulo(page)).toContainText('Gênesis');
    await expect(page).toHaveTitle('Gênesis 1 · Bíblia App');
    await expect(page.locator('#v1')).toContainText('No princípio');
    await expect(page).toHaveURL(/#\/ler\/GEN\/1$/);
  });

  test('navega, vai para referência digitada e reabre na última posição', async ({ page }) => {
    await page.goto('./');
    await expect(tituloCapitulo(page)).toContainText('Gênesis', { timeout: 30_000 });

    await page.getByRole('button', { name: /^Próximo capítulo/ }).click();
    await expect(page).toHaveURL(/#\/ler\/GEN\/2$/);

    await page.getByRole('button', { name: /escolher livro/ }).click();
    await page.getByRole('searchbox').fill('jo 3:16');
    await page.getByRole('searchbox').press('Enter');
    await expect(page).toHaveURL(/#\/ler\/JHN\/3\/16$/);
    await expect(page.locator('#v16')).toContainText('Porque Deus amou ao mundo');
    await expect(page.locator('#v16')).toBeInViewport();

    await page.goto('./');
    await expect(page).toHaveURL(/#\/ler\/JHN\/3$/);
    await expect(tituloCapitulo(page)).toContainText('João');
  });

  test('não tem violações de acessibilidade', async ({ page }) => {
    await page.goto('./#/ler/PSA/23');
    await expect(tituloCapitulo(page)).toContainText('Salmos', { timeout: 30_000 });
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });

  test('publica o manifest do PWA', async ({ request }) => {
    const resposta = await request.get('manifest.webmanifest');
    expect(resposta.ok()).toBe(true);
    expect((await resposta.json()) as { name: string }).toMatchObject({ name: 'Bíblia App' });
  });
});
