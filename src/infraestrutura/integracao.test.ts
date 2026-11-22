/**
 * Integração: importa a BLIVRE real (public/dados) para o IndexedDB (fake) pelos
 * adapters de produção e lê capítulos com casos conhecidos da fonte.
 */
import 'fake-indexeddb/auto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrepararVersaoPadrao } from '../aplicacao/casos-de-uso';
import { Canon, Referencia, VersaoId } from '../dominio/biblia';
import { BancoApp, DexieTextoBiblicoRepository } from './dexie';
import { FonteEstatica } from './fontes';

const canon = new Canon();
const blivre = VersaoId.de('BLIVRE');
const arquivos = import.meta.glob<string>('/public/dados/BLIVRE/*.json', {
  query: '?raw',
  import: 'default',
});
const lerDoDisco: typeof fetch = async (url) => {
  const carregar = arquivos[`/public/${String(url)}`];
  return carregar ? new Response(await carregar()) : new Response(null, { status: 404 });
};

describe('BLIVRE embarcada → IndexedDB', () => {
  const db = new BancoApp(`teste-${crypto.randomUUID()}`);
  const texto = new DexieTextoBiblicoRepository(db, canon);
  const ref = (t: string) => Referencia.parse(t, canon);

  beforeAll(async () => {
    await new PrepararVersaoPadrao(
      canon,
      new FonteEstatica('', lerDoDisco),
      texto,
      blivre,
    ).executar();
  }, 30_000);
  afterAll(() => db.delete());

  it('importa os 1189 capítulos', async () => {
    expect(await db.capitulos.count()).toBe(1189);
  });

  it('lê Jo 3:16, Gn 1:1 e Ap 22:21', async () => {
    expect((await texto.obterCapitulo(blivre, ref('Jo 3')))?.versiculo(16)?.texto).toMatch(
      /^Porque Deus amou ao mundo/,
    );
    expect((await texto.obterCapitulo(blivre, ref('Gn 1')))?.versiculo(1)?.texto).toMatch(
      /^No princípio/,
    );
    expect((await texto.obterCapitulo(blivre, ref('Ap 22')))?.versiculos.at(-1)?.numero).toBe(21);
  });

  it('preserva a lacuna do Sl 46:3', async () => {
    const sl46 = await texto.obterCapitulo(blivre, ref('Sl 46'));
    expect(sl46?.versiculos.slice(0, 3).map((v) => v.numero)).toEqual([1, 2, 4]);
  });
});
