// page.evaluate roda no navegador: tipos do DOM só neste arquivo.
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });
const numero = (page: Page, n: number) =>
  page.getByRole('button', { name: new RegExp(`^Versículo ${n}(,|$)`) });
const barraVersiculo = (page: Page) => page.getByRole('region', { name: /^Ações do versículo/ });
const editor = (page: Page) => page.getByRole('dialog');
const rodape = (page: Page) => page.getByRole('region', { name: 'Notas do capítulo' });
const textoDo = (page: Page, n: number) => page.locator(`[data-texto-versiculo="${n}"]`);

async function anotar(page: Page, versiculo: number, texto: string, inline = false) {
  await numero(page, versiculo).click();
  await barraVersiculo(page).getByRole('button', { name: 'Anotar' }).click();
  await editor(page).getByRole('textbox', { name: 'Texto da nota' }).fill(texto);
  if (inline)
    await editor(page)
      .getByRole('radio', { name: /^Inline/ })
      .check();
  await editor(page).getByRole('button', { name: 'Salvar' }).click();
  await expect(editor(page)).toBeHidden();
}

test.describe('Anotações (UC06)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/ler/JHN/3');
    await expect(tituloCapitulo(page)).toContainText('João', { timeout: 30_000 });
  });

  test('nota de rodapé com marcador, persiste, navega e vira inline (US04)', async ({ page }) => {
    await anotar(page, 16, 'O versículo-síntese do **Evangelho**.');
    const marcador = textoDo(page, 16).getByRole('button', { name: 'Nota 1' });
    await expect(marcador).toBeVisible();
    await expect(rodape(page).getByRole('listitem')).toContainText('Jo 3:16');
    await expect(rodape(page).locator('strong', { hasText: 'Evangelho' })).toBeVisible();

    await page.reload();
    await expect(marcador).toBeVisible({ timeout: 30_000 });
    await marcador.click();
    await expect(rodape(page).getByRole('listitem').first()).toBeFocused();

    await rodape(page).getByRole('button', { name: 'Editar nota' }).click();
    await editor(page)
      .getByRole('radio', { name: /^Inline/ })
      .check();
    await editor(page).getByRole('button', { name: 'Salvar' }).click();
    const bloco = page.getByRole('complementary', { name: 'Nota em Jo 3:16' });
    await expect(bloco).toContainText('O versículo-síntese do Evangelho.');
    await expect(rodape(page)).toBeHidden();

    await bloco.getByRole('button', { name: 'Editar nota' }).click();
    await editor(page).getByRole('button', { name: 'Excluir', exact: true }).click();
    await editor(page).getByRole('button', { name: 'Excluir nota' }).click();
    await expect(bloco).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('Nota excluída.');
  });

  test('nota de um destaque fica logo após o trecho marcado', async ({ page }) => {
    const ponto = await page.evaluate(() => {
      const el = document.querySelector('[data-texto-versiculo="16"]');
      const t = el?.firstChild;
      if (!el || !t) throw new Error('v16');
      el.scrollIntoView({ block: 'center' });
      const r = document.createRange();
      const i = t.textContent?.indexOf('Filho') ?? -1;
      r.setStart(t, i);
      r.setEnd(t, i + 5);
      const { left, top, width, height } = r.getBoundingClientRect();
      return { x: left + width / 2, y: top + height / 2 };
    });
    await page.mouse.dblclick(ponto.x, ponto.y);
    await page.getByRole('button', { name: 'Marcar em verde' }).click();
    const marca = textoDo(page, 16).locator('mark');
    await expect(marca).toHaveText('Filho');

    await marca.click();
    await page
      .getByRole('region', { name: 'Destaque em João 3:16' })
      .getByRole('button', { name: 'Anotar' })
      .click();
    await expect(editor(page)).toHaveAccessibleName('Nota no destaque João 3:16');
    await editor(page).getByRole('textbox').fill('Gr. *huios*');
    await editor(page).getByRole('button', { name: 'Salvar' }).click();

    const marcador = textoDo(page, 16).getByRole('button', { name: 'Nota 1' });
    await expect(marcador).toBeVisible();
    expect(await marcador.evaluate((m) => (m.previousSibling as Element | null)?.textContent)).toBe(
      'Filho',
    );
  });

  test('funciona só pelo teclado (Ctrl+Enter salva, foco volta ao versículo)', async ({
    page,
    browserName,
  }) => {
    await numero(page, 3).focus();
    await page.keyboard.press('Enter');
    await expect(barraVersiculo(page).getByRole('button', { name: 'Favoritar' })).toBeFocused();
    // No WebKit (Safari/macOS), Tab só percorre campos; Alt+Tab inclui botões.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(barraVersiculo(page).getByRole('button', { name: 'Anotar' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(editor(page).getByRole('textbox')).toBeFocused();
    await page.keyboard.type('Nascer de novo');
    await page.keyboard.press('ControlOrMeta+Enter');

    await expect(editor(page)).toBeHidden();
    await expect(numero(page, 3)).toBeFocused();
    await expect(rodape(page)).toContainText('Nascer de novo');
  });

  test('não tem violações de acessibilidade com notas e o editor aberto', async ({ page }) => {
    await anotar(page, 3, 'Rodapé com *ênfase*');
    await anotar(page, 5, '- item um\n- item dois', true);
    await numero(page, 7).click();
    await barraVersiculo(page).getByRole('button', { name: 'Anotar' }).click();
    await expect(editor(page)).toBeVisible();
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
