import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const cartao = (page: Page, nome: string) => page.getByRole('region', { name: nome });

test.describe('Planos de leitura (UC07/UC08)', () => {
  test('inicia, lê pela faixa, conclui o dia e o progresso persiste', async ({ page }) => {
    await page.goto('./#/planos');
    await page
      .getByRole('button', { name: 'Iniciar Salmos e Provérbios em 31 dias' })
      .click({ timeout: 30_000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Iniciar plano' }).click();

    const plano = cartao(page, 'Salmos e Provérbios em 31 dias');
    await expect(plano).toContainText('Leitura de hoje · dia 1');
    await expect(plano).toContainText('Salmos 1, 31, 61, 91, 121; Provérbios 1');

    await plano.getByRole('link', { name: 'Ler agora' }).click();
    await expect(page).toHaveURL(/#\/ler\/PSA\/1$/);
    const faixa = page.getByRole('complementary', { name: 'Planos de leitura' });
    await faixa.getByRole('button', { name: 'Concluir dia 1' }).click();
    await expect(faixa.getByRole('button', { name: '✓ Dia 1 concluído' })).toBeVisible();

    await page.reload();
    await page.getByRole('link', { name: 'Planos' }).click();
    await expect(plano).toContainText('1 de 31 dias concluídos');
    await expect(plano.getByText('✓ Concluído')).toBeVisible();
  });

  // Acessibilidade numa página nova (sem recarregar nem passar pela leitura): no Firefox da
  // CI, o axe logo depois de recarregar a leitura derrubou a página ("Page crashed").
  test('tela de Planos sem violações de acessibilidade (axe)', async ({ page }) => {
    await page.goto('./#/planos');
    await page
      .getByRole('button', { name: 'Iniciar Salmos e Provérbios em 31 dias' })
      .click({ timeout: 30_000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Iniciar plano' }).click();
    const plano = cartao(page, 'Salmos e Provérbios em 31 dias');
    await plano.getByRole('button', { name: '✓ Concluir' }).click();
    await expect(plano.getByText('✓ Concluído')).toBeVisible();

    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });

  test('encerra o plano com confirmação', async ({ page }) => {
    await page.goto('./#/planos');
    await page
      .getByRole('button', { name: 'Iniciar Novo Testamento em 90 dias' })
      .click({ timeout: 30_000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Iniciar plano' }).click();
    await page.getByRole('button', { name: 'Ações de Novo Testamento em 90 dias' }).click();
    await page.getByRole('menuitem', { name: 'Encerrar plano' }).click();
    await page
      .getByRole('dialog', { name: 'Encerrar plano?' })
      .getByRole('button', { name: 'Encerrar plano' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Iniciar Novo Testamento em 90 dias' }),
    ).toBeVisible();
  });
});
