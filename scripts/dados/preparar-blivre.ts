/**
 * Prepara a versão embarcada (BLIVRE) a partir do Projeto-Euaggelion/biblia.data.
 *
 *   npm run dados:blivre            # baixa do GitHub
 *   npm run dados:blivre -- <dir>   # usa uma cópia local de data/canonical/BLIVRE
 *
 * Saída: public/dados/BLIVRE/<LIVRO>.json (versionados no repositório; precache do PWA).
 * Rodar só quando a fonte mudar — revise o diff antes de commitar.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DADOS_CANON } from '../../src/dominio/biblia/dados-canon.ts';
import { converterLivro, type LivroOrigem } from './normalizar.ts';

const SIGLA = 'BLIVRE';
const FONTE = `https://raw.githubusercontent.com/Projeto-Euaggelion/biblia.data/main/data/canonical/${SIGLA}`;
const SAIDA = join(import.meta.dirname, '../../public/dados', SIGLA);

async function lerOrigem(codigo: string, dirLocal: string | undefined): Promise<LivroOrigem> {
  if (dirLocal) return JSON.parse(await readFile(join(dirLocal, `${codigo}.json`), 'utf-8'));
  const resposta = await fetch(`${FONTE}/${codigo}.json`);
  if (!resposta.ok) throw new Error(`${codigo}: HTTP ${resposta.status}`);
  return (await resposta.json()) as LivroOrigem;
}

async function main() {
  const dirLocal = process.argv[2];
  console.log(`Origem: ${dirLocal ?? FONTE}`);

  const livros = await Promise.all(
    DADOS_CANON.map(async ([codigo, , , totalCapitulos]) =>
      converterLivro(await lerOrigem(codigo, dirLocal), { codigo, totalCapitulos }),
    ),
  );

  await rm(SAIDA, { recursive: true, force: true });
  await mkdir(SAIDA, { recursive: true });
  for (const livro of livros) {
    await writeFile(join(SAIDA, `${livro.livro}.json`), JSON.stringify(livro) + '\n');
  }

  const versiculos = livros.reduce(
    (soma, l) => soma + l.capitulos.reduce((s, c) => s + c.length, 0),
    0,
  );
  console.log(`✔ ${livros.length} livros · ${versiculos} versículos → ${SAIDA}`);
}

await main();
