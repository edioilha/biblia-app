import { expect, test } from '@playwright/test';

// RNF03 — nenhuma tela pode ficar mais larga que a janela (no celular, a navegação vai
// para a tab bar inferior). A largura mínima suportada ainda será definida (BL-10).
for (const [nome, rota] of [
  ['Leitura', './#/ler/JHN/3'],
  ['Busca', './#/buscar?q=luz'],
  ['Planos', './#/planos'],
  ['Meus Estudos', './#/estudos'],
  ['Versões', './#/versoes'],
] as const) {
  test(`${nome}: sem rolagem horizontal da página`, async ({ page }) => {
    await page.goto(rota);
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('main')).toBeVisible();
    const { largura, janela } = await page.evaluate(() => ({
      largura: document.documentElement.scrollWidth,
      janela: window.innerWidth,
    }));
    expect(largura).toBeLessThanOrEqual(janela);
  });
}
