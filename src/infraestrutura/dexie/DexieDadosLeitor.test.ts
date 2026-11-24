import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mesclarDados } from '../../dominio/backup';
import { anotacao } from '../../test/anotacoes';
import { favorito, inscricao } from '../../test/dadosLeitor';
import { canon, destaque, notacao } from '../../test/destaques';
import { BancoApp } from './BancoApp';
import { DexieDadosLeitor } from './DexieDadosLeitor';

describe('DexieDadosLeitor (UC11)', () => {
  let db: BancoApp;
  let dados: DexieDadosLeitor;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    dados = new DexieDadosLeitor(db, canon);
  });
  afterEach(() => db.delete());

  it('grava a importação e lê tudo de volta', async () => {
    await dados.aplicar({
      favoritos: [favorito(1, 'Jo 3:16')],
      destaques: [destaque(1, '1:0-1:3')],
      anotacoes: [anotacao(1, 'Jo 3:16')],
      inscricoes: [inscricao(1, [1, 2])],
      inscricoesRemovidas: [],
    });
    const lido = await dados.ler();
    expect(lido.favoritos.map((f) => f.referencia.chave())).toEqual(['JHN.3.16']);
    expect(lido.destaques.map((d) => [d.cor, notacao(d.intervalo)])).toEqual([
      ['AMARELO', '1:0-1:3'],
    ]);
    expect(lido.anotacoes[0]?.conteudo).toBe('Nota 1');
    expect([...(lido.inscricoes[0]?.diasConcluidos ?? [])]).toEqual([1, 2]);
  });

  it('troca a inscrição do mesmo plano (índice único) numa só transação', async () => {
    await dados.aplicar({
      favoritos: [],
      destaques: [],
      anotacoes: [],
      inscricoes: [inscricao(1, [1])],
      inscricoesRemovidas: [],
    });
    const { alteracoes } = mesclarDados(await dados.ler(), {
      favoritos: [],
      destaques: [],
      anotacoes: [],
      inscricoes: [inscricao(2, [1, 2, 3])],
    });
    await dados.aplicar(alteracoes);
    const lido = await dados.ler();
    expect(lido.inscricoes.map((i) => i.id.slice(-4))).toEqual(['c002']);
  });

  it('ignora registros inválidos na leitura', async () => {
    await db.favoritos.put({
      id: 'x',
      chave: 'XXX.1.1',
      livro: 'XXX',
      capitulo: 1,
      criadoEm: new Date(),
    });
    expect((await dados.ler()).favoritos).toEqual([]);
  });
});
