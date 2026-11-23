import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });
const numero = (page: Page, n: number) =>
  page.getByRole('button', { name: new RegExp(`^Versículo ${n}(,|$)`) });
const barraVersiculo = (page: Page) => page.getByRole('region', { name: /^Ações do versículo/ });
const editor = (page: Page) => page.getByRole('dialog');
const status = (page: Page) => page.getByRole('status').first();
const aba = (page: Page, nome: string) => page.getByRole('tab', { name: new RegExp(`^${nome}`) });

/** Favorita Jo 3:16 e anota Jo 3:17 na leitura. */
async function marcarNaLeitura(page: Page) {
  await page.goto('./#/ler/JHN/3');
  await expect(tituloCapitulo(page)).toContainText('João', { timeout: 30_000 });

  await numero(page, 16).click();
  await barraVersiculo(page)
    .getByRole('button', { name: /Favoritar/ })
    .click();
  await expect(numero(page, 16)).toHaveAccessibleName(/favorito/);

  await numero(page, 17).click();
  await barraVersiculo(page).getByRole('button', { name: 'Anotar' }).click();
  await editor(page).getByRole('textbox', { name: 'Texto da nota' }).fill('Salvar, não condenar.');
  await editor(page).getByRole('button', { name: 'Salvar' }).click();
  await expect(editor(page)).toBeHidden();
}

test.describe('Meus Estudos (UC13)', () => {
  test('lista o que foi marcado, abre no versículo e volta à mesma aba', async ({ page }) => {
    await marcarNaLeitura(page);

    await page.getByRole('link', { name: 'Meus Estudos' }).click();
    await expect(page).toHaveURL(/#\/estudos$/);
    await expect(status(page)).toHaveText('1 favorito · página 1 de 1');
    await expect(aba(page, 'Anotações')).toContainText('1');

    await aba(page, 'Anotações').click();
    await expect(page).toHaveURL(/aba=anotacoes/);
    const item = page.getByRole('list', { name: 'Anotações' }).getByRole('link');
    await expect(item).toContainText('João 3:17');
    await expect(item).toContainText('Salvar, não condenar.');

    await item.click();
    await expect(page).toHaveURL(/#\/ler\/JHN\/3\/17$/);
    await expect(page.locator('#v17')).toHaveClass(/versiculo-foco/);

    await page.goBack();
    await expect(aba(page, 'Anotações')).toHaveAttribute('aria-selected', 'true');
  });

  test('filtra, remove com confirmação e passa no axe', async ({ page }) => {
    await marcarNaLeitura(page);
    await page.goto('./#/estudos?aba=anotacoes');
    await expect(status(page)).toHaveText(/1 anotação/);

    await page.getByRole('searchbox', { name: 'Filtrar no texto ou na nota' }).fill('condenar');
    await expect(page).toHaveURL(/q=condenar/);
    await expect(status(page)).toHaveText(/1 anotação/);
    await page.getByRole('searchbox', { name: 'Filtrar no texto ou na nota' }).fill('xyzw');
    await expect(status(page)).toHaveText(/Nenhum item/);
    await page.getByRole('button', { name: 'Limpar filtros' }).click();

    await aba(page, 'Favoritos').click();
    await page.getByRole('button', { name: 'Ações de João 3:16' }).click();
    await page.getByRole('menuitem', { name: 'Remover dos favoritos' }).click();
    await page
      .getByRole('dialog', { name: 'Remover dos favoritos?' })
      .getByRole('button', { name: 'Remover favorito' })
      .click();
    await expect(page.getByText('Selecione um texto na leitura')).toHaveCount(0);
    await expect(aba(page, 'Favoritos')).toContainText('0');

    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
