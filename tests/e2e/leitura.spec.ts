import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Página inicial', () => {
  test('carrega e exibe o título', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle('Bíblia App');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bíblia App');
  });

  test('não tem violações de acessibilidade', async ({ page }) => {
    await page.goto('./');
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });

  test('publica o manifest do PWA', async ({ request }) => {
    const resposta = await request.get('manifest.webmanifest');
    expect(resposta.ok()).toBe(true);
    expect((await resposta.json()) as { name: string }).toMatchObject({ name: 'Bíblia App' });
  });
});
