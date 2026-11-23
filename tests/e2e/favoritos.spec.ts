import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });
const numero = (page: Page, n: number, favorito = false) =>
  page.getByRole('button', { name: `Versículo ${n}${favorito ? ', favorito' : ''}`, exact: true });
const acoes = (page: Page) => page.getByRole('region', { name: /^Ações do versículo/ });

test.describe('Favoritos (UC04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/ler/JHN/3');
    await expect(tituloCapitulo(page)).toContainText('João', { timeout: 30_000 });
  });

  test('favorita João 3:16, mantém após recarregar e desfavorita', async ({ page }) => {
    await numero(page, 16).click();
    await expect(acoes(page)).toHaveAccessibleName('Ações do versículo João 3:16');
    await acoes(page)
      .getByRole('button', { name: /Favoritar/ })
      .click();

    await expect(numero(page, 16, true)).toContainText('★');
    await expect(page.getByRole('status')).toHaveText('João 3:16 adicionado aos favoritos.');

    await page.reload();
    await expect(numero(page, 16, true)).toBeVisible({ timeout: 30_000 });

    await numero(page, 16, true).click();
    await acoes(page)
      .getByRole('button', { name: /Remover favorito/ })
      .click();
    await expect(numero(page, 16)).not.toContainText('★');
  });

  test('funciona só pelo teclado', async ({ page }) => {
    await numero(page, 1).focus();
    await page.keyboard.press('Enter');
    await expect(acoes(page).getByRole('button', { name: /Favoritar/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(numero(page, 1, true)).toBeFocused();
  });

  test('não tem violações de acessibilidade com a barra de ações aberta', async ({ page }) => {
    await numero(page, 16).click();
    await acoes(page)
      .getByRole('button', { name: /Favoritar/ })
      .click();
    await numero(page, 3).click();
    await expect(acoes(page)).toBeVisible();
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
