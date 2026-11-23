// page.evaluate roda no navegador: tipos do DOM só neste arquivo.
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tituloCapitulo = (page: Page) => page.getByRole('heading', { level: 1 });
const barraSelecao = (page: Page) =>
  page.getByRole('region', { name: 'Marcar trecho selecionado' });
const marcas = (page: Page) => page.locator('mark.marca-texto');

/** Centro da palavra no texto do versículo (coordenadas da janela); rola até ele se pedido. */
async function centroDa(page: Page, versiculo: number, palavra: string, rolar = true) {
  return page.evaluate(
    ([v, p, r]) => {
      const el = document.querySelector(`[data-texto-versiculo="${v}"]`);
      if (!el) throw new Error(`versículo ${v}`);
      if (r) el.scrollIntoView({ block: 'center' });
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const i = n.textContent?.indexOf(p) ?? -1;
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + p.length);
        const { left, top, width, height } = r.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
      }
      throw new Error(`"${p}" não está no versículo ${v}`);
    },
    [versiculo, palavra, rolar] as const,
  );
}

/** Arrasta o mouse do meio de uma palavra ao meio de outra (seleção real do navegador). */
async function arrastar(page: Page, de: [number, string], ate: [number, string]) {
  await centroDa(page, ...de);
  // Mede as duas pontas sem rolar de novo, para as coordenadas valerem juntas.
  const a = await centroDa(page, ...de, false);
  const b = await centroDa(page, ...ate, false);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}

test.describe('Marca-texto (UC05)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/ler/JHN/3');
    await expect(tituloCapitulo(page)).toContainText('João', { timeout: 30_000 });
  });

  test('marca só o trecho selecionado, ajustado a palavras inteiras (US03)', async ({ page }) => {
    await arrastar(page, [16, 'Deus'], [16, 'mundo']);
    await barraSelecao(page).getByRole('button', { name: 'Marcar em amarelo' }).click();

    await expect(marcas(page)).toHaveText(['Deus amou ao mundo']);
    await expect(page.getByRole('status')).toHaveText('Trecho marcado em amarelo.');
    await expect(barraSelecao(page)).toBeHidden();
  });

  test('cobre dois versículos parcialmente e persiste ao reabrir (US03)', async ({ page }) => {
    await arrastar(page, [16, 'eterna'], [17, 'Deus']);
    await barraSelecao(page).getByRole('button', { name: 'Marcar em verde' }).click();
    await expect(marcas(page)).toHaveText(['eterna.', ' ', 'Porque Deus']);

    await page.reload();
    await expect(marcas(page)).toHaveText(['eterna.', ' ', 'Porque Deus'], { timeout: 30_000 });
    await expect(marcas(page).first()).toHaveAttribute('data-cor', 'VERDE');
  });

  test('duplo clique numa palavra, marcar, tocar no destaque e remover (A2)', async ({ page }) => {
    const filho = await centroDa(page, 16, 'Filho');
    await page.mouse.dblclick(filho.x, filho.y);
    await barraSelecao(page).getByRole('button', { name: 'Marcar em rosa' }).click();
    await expect(marcas(page)).toHaveText(['Filho']);

    await marcas(page).first().click();
    const barra = page.getByRole('region', { name: 'Destaque em João 3:16' });
    await expect(barra.getByRole('button', { name: 'Rosa' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await barra.getByRole('button', { name: 'Remover' }).click();
    await expect(marcas(page)).toHaveCount(0);
  });

  test('não tem violações de acessibilidade com destaques e a barra aberta', async ({ page }) => {
    for (const [palavra, cor] of [
      ['Deus', 'amarelo'],
      ['mundo', 'verde'],
      ['Filho', 'rosa'],
      ['vida', 'azul'],
    ] as const) {
      const p = await centroDa(page, 16, palavra);
      await page.mouse.dblclick(p.x, p.y);
      await barraSelecao(page)
        .getByRole('button', { name: `Marcar em ${cor}` })
        .click();
      await expect(page.getByRole('status')).toHaveText(`Trecho marcado em ${cor}.`);
    }
    await arrastar(page, [17, 'Porque'], [17, 'Deus']);
    await expect(barraSelecao(page)).toBeVisible();
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });
});
