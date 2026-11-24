import AxeBuilder from '@axe-core/playwright';
import axe from 'axe-core';
import { test, type Page } from '@playwright/test';

// TEMPORÁRIO — diagnóstico do "Page crashed" do axe no Firefox da CI. Será removido.
test.skip(({ browserName }) => browserName !== 'firefox');
test.describe.configure({ retries: 0 });
test.setTimeout(600_000);

let iniciado = false;
async function comPlano(page: Page) {
  await page.goto('./#/planos');
  if (!iniciado) {
    await page
      .getByRole('button', { name: 'Iniciar Salmos e Provérbios em 31 dias' })
      .click({ timeout: 30_000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Iniciar plano' }).click();
    iniciado = true;
  }
  await page
    .getByRole('region', { name: 'Salmos e Provérbios em 31 dias' })
    .waitFor({ timeout: 30_000 });
}

test('DIAG regras no cartão', async ({ context }) => {
  const regras = axe.getRules(['wcag2a', 'wcag2aa']).map((r) => r.ruleId);
  const quebram: string[] = [];
  for (const regra of regras) {
    const page = await context.newPage();
    await comPlano(page);
    try {
      await new AxeBuilder({ page })
        .include('main section[aria-labelledby]')
        .withRules([regra])
        .analyze();
    } catch (e) {
      quebram.push(`${regra}: ${String(e).slice(0, 60)}`);
    }
    await page.close().catch(() => undefined);
  }
  console.log(`DIAG-RESULT quebram: ${JSON.stringify(quebram)}`);
  const page = await context.newPage();
  await comPlano(page);
  console.log(
    `DIAG-RESULT html: ${(await page.locator('main section[aria-labelledby]').first().innerHTML()).slice(0, 3000)}`,
  );
});
