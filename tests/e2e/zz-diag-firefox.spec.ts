import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';

// TEMPORÁRIO — diagnóstico do "Page crashed" do axe no Firefox da CI. Será removido.
test.skip(({ browserName }) => browserName !== 'firefox');
test.describe.configure({ retries: 0 });

async function comPlano(page: Page) {
  await page.goto('./#/planos');
  await page
    .getByRole('button', { name: 'Iniciar Salmos e Provérbios em 31 dias' })
    .click({ timeout: 30_000 });
  await page.getByRole('dialog').getByRole('button', { name: 'Iniciar plano' }).click();
  await page.getByRole('region', { name: 'Salmos e Provérbios em 31 dias' }).waitFor();
}
const casos: [string, (p: Page) => Promise<void>, (a: AxeBuilder) => AxeBuilder][] = [
  [
    'A catalogo vazio',
    async (p) => {
      await p.goto('./#/planos');
      await p.getByText('Escolha um plano para começar').waitFor({ timeout: 30_000 });
    },
    (a) => a,
  ],
  ['B so cartao', comPlano, (a) => a.include('main section[aria-labelledby]')],
  ['C sem cartao', comPlano, (a) => a.exclude('main section[aria-labelledby]')],
  ['D sem color-contrast', comPlano, (a) => a.disableRules(['color-contrast'])],
  ['E so color-contrast', comPlano, (a) => a.withRules(['color-contrast'])],
  ['F so progressbar', comPlano, (a) => a.include('[role=progressbar]')],
  ['G so header', comPlano, (a) => a.include('header')],
  ['H sem progressbar', comPlano, (a) => a.exclude('[role=progressbar]')],
];
for (const [nome, preparar, ajustar] of casos) {
  test(`DIAG ${nome}`, async ({ page }) => {
    await preparar(page);
    try {
      await ajustar(new AxeBuilder({ page })).analyze();
      console.log(`DIAG-RESULT ${nome}: ok`);
    } catch (e) {
      console.log(`DIAG-RESULT ${nome}: ${String(e).slice(0, 80)}`);
    }
  });
}
