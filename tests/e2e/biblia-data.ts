import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DADOS = join(import.meta.dirname, '../../public/dados/BLIVRE');
export const BIBLIA_DATA = 'https://raw.githubusercontent.com/Projeto-Euaggelion/biblia.data/**';

/**
 * Simula o biblia.data (sem rede na CI): devolve os livros da BLIVRE no formato canônico,
 * com o texto marcado pela sigla ("[TB] No princípio…"). `falhar` responde 503.
 */
export async function simularBibliaData(page: Page, { falhar = false } = {}) {
  await page.route(BIBLIA_DATA, async (rota) => {
    if (falhar) return rota.fulfill({ status: 503 });
    const [, sigla, livro] = /canonical\/(\w+)\/(\w+)\.json$/.exec(rota.request().url()) ?? [];
    const embarcado = JSON.parse(await readFile(join(DADOS, `${livro}.json`), 'utf-8')) as {
      capitulos: [number, string][][];
    };
    await rota.fulfill({
      json: {
        id: 0,
        code: livro,
        name: livro,
        abbrev: livro,
        chapters: embarcado.capitulos.map((versiculos, i) => ({
          number: i + 1,
          verses: versiculos.map(([number, text]) => ({ number, text: `[${sigla}] ${text}` })),
        })),
      },
    });
  });
}
