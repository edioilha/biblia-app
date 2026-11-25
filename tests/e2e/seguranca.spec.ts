import { expect, test, type Page } from '@playwright/test';
import { simularBibliaData } from './biblia-data';

/**
 * BL-16 — Content-Security-Policy: o app inteiro funciona sem nenhuma violação, e um
 * script injetado é bloqueado. As violações são coletadas pelo evento do navegador.
 */
declare global {
  interface Window {
    violacoesCsp: string[];
  }
}

async function coletarViolacoes(page: Page) {
  await page.addInitScript(() => {
    window.violacoesCsp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.violacoesCsp.push(`${e.effectiveDirective} ${e.blockedURI}`),
    );
  });
}
const violacoes = (page: Page) => page.evaluate(() => window.violacoesCsp);

test.describe('Content-Security-Policy (BL-16)', () => {
  // O SW faria os fetch do biblia.data por fora do page.route no WebKit (ver versoes.spec).
  test.use({ serviceWorkers: 'block' });

  test('a política está na página e os fluxos principais não a violam', async ({ page }) => {
    test.setTimeout(90_000);
    await coletarViolacoes(page);
    await simularBibliaData(page);
    await page.goto('./#/ler/JHN/3');
    await expect(page.locator('#v16')).toContainText('Porque Deus amou', { timeout: 30_000 });

    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');

    // Leitura: tema escuro e favorito.
    await page.getByRole('button', { name: 'Aparência da leitura' }).click();
    await page.getByRole('group', { name: 'Tema' }).getByText('Escuro', { exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Versículo 16', exact: true }).click();
    await page
      .getByRole('region', { name: /^Ações do versículo/ })
      .getByRole('button', { name: /Favoritar/ })
      .click();

    // Busca (worker).
    await page.getByRole('link', { name: 'Buscar' }).click();
    await page.getByRole('searchbox').fill('amor');
    await expect(page.getByRole('status').first()).toContainText(/versículos encontrados/, {
      timeout: 30_000,
    });

    // Versões: download do biblia.data (connect-src).
    await page.getByRole('link', { name: 'Versões' }).click();
    await page.getByRole('button', { name: 'Instalar Tradução Brasileira' }).click();
    await expect(page.getByRole('radio', { name: /TB · Tradução Brasileira/ })).toBeVisible({
      timeout: 30_000,
    });

    // Backup: exportar (blob) e importar.
    await page.getByRole('link', { name: 'Meus Estudos' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar backup' }).click();
    await page.getByLabel('Arquivo de backup').setInputFiles(await (await download).path());
    await page
      .getByRole('dialog', { name: 'Importar backup?' })
      .getByRole('button', { name: 'Importar' })
      .click();
    await expect(page.getByRole('dialog', { name: 'Backup importado' })).toBeVisible();

    expect(await violacoes(page)).toEqual([]);
  });

  test('bloqueia script inline injetado na página', async ({ page }) => {
    await coletarViolacoes(page);
    await page.goto('./#/ler/JHN/3');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      const s = document.createElement('script');
      s.textContent = 'window.injetado = true';
      document.body.append(s);
    });
    await expect.poll(() => violacoes(page)).toContainEqual(expect.stringMatching(/^script-src/));
    expect(await page.evaluate(() => 'injetado' in window)).toBe(false);
  });
});
