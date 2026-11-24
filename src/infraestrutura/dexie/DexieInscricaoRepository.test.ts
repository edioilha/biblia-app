import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataLocal, InscricaoId, InscricaoPlano, PlanoId } from '../../dominio/planos';
import { BancoApp } from './BancoApp';
import { DexieInscricaoRepository } from './DexieInscricaoRepository';

const id = (n: number) =>
  InscricaoId.de(`00000000-0000-7000-8000-00000000c${String(n).padStart(3, '0')}`);
const inscricao = (n: number, plano: string, dias: number[] = []) =>
  InscricaoPlano.criar(id(n), PlanoId.de(plano), 90, DataLocal.iso('2026-11-01'), dias);

describe('DexieInscricaoRepository', () => {
  let db: BancoApp;
  let repo: DexieInscricaoRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexieInscricaoRepository(db);
  });
  afterEach(() => db.delete());

  it('grava no formato do schema e reconstitui a inscrição', async () => {
    await repo.salvar(inscricao(1, 'nt-90-dias', [3, 1, 2]));
    expect(await db.inscricoes.toArray()).toEqual([
      {
        id: id(1),
        planoId: 'nt-90-dias',
        totalDias: 90,
        inicio: '2026-11-01',
        diasConcluidos: [1, 2, 3],
        diaInicial: 1,
      },
    ]);
    const lida = await repo.porId(id(1));
    expect(lida?.inicio.paraIso()).toBe('2026-11-01');
    expect([...(lida?.diasConcluidos ?? [])]).toEqual([1, 2, 3]);
    expect(lida?.totalDias).toBe(90);
  });

  it('guarda o dia inicial; registro antigo, sem ele, começa no dia 1', async () => {
    await repo.salvar(
      InscricaoPlano.criar(
        id(1),
        PlanoId.de('nt-90-dias'),
        90,
        DataLocal.iso('2026-11-01'),
        [],
        40,
      ),
    );
    expect((await repo.porId(id(1)))?.diaDoPlano(1)).toBe(40);
    await db.inscricoes.put({
      id: id(2),
      planoId: 'salmos-proverbios-31-dias',
      totalDias: 31,
      inicio: '2026-11-01',
      diasConcluidos: [],
    });
    expect((await repo.porId(id(2)))?.diaInicial).toBe(1);
  });

  it('busca por plano, lista todas e remove', async () => {
    await repo.salvar(inscricao(1, 'nt-90-dias'));
    await repo.salvar(inscricao(2, 'biblia-1-ano'));
    expect((await repo.porPlano(PlanoId.de('biblia-1-ano')))?.id).toBe(id(2));
    expect(await repo.porPlano(PlanoId.de('outro'))).toBeNull();
    expect(await repo.todas()).toHaveLength(2);

    await repo.remover(id(1));
    expect((await repo.todas()).map((i) => i.id)).toEqual([id(2)]);
  });

  it('um plano tem no máximo uma inscrição (índice único)', async () => {
    await repo.salvar(inscricao(1, 'nt-90-dias'));
    await expect(repo.salvar(inscricao(2, 'nt-90-dias'))).rejects.toThrow();
  });

  it('ignora registros inválidos', async () => {
    await db.inscricoes.put({
      id: 'x',
      planoId: 'nt',
      totalDias: 3,
      inicio: '2026-13-01',
      diasConcluidos: [],
    });
    expect(await repo.todas()).toEqual([]);
  });
});

describe('BancoApp — migração v4 → v5', () => {
  it('preserva as anotações e cria a tabela de inscrições', async () => {
    const nome = `teste-${crypto.randomUUID()}`;
    const v4 = new Dexie(nome);
    v4.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
    v4.version(2).stores({ favoritos: 'id, &chave, [livro+capitulo], criadoEm' });
    v4.version(3).stores({ destaques: 'id, [versaoId+livro+capitulo], criadoEm' });
    v4.version(4).stores({ anotacoes: 'id, [livro+capitulo], atualizadoEm, destaqueId' });
    await v4.table('anotacoes').put({ id: 'a1', livro: 'JHN', capitulo: 3 });
    v4.close();

    const db = new BancoApp(nome);
    expect(await db.anotacoes.count()).toBe(1);
    expect(await db.inscricoes.count()).toBe(0);
    expect(db.verno).toBe(5);
    await db.delete();
  });
});
