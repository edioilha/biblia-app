import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Referencia, VersaoId } from '../../dominio/biblia';
import { BLIVRE, canon, destaque, idDestaque, notacao } from '../../test/destaques';
import { BancoApp, type DestaqueRegistro } from './BancoApp';
import { DexieDestaqueRepository } from './DexieDestaqueRepository';

const ref = (t: string) => Referencia.parse(t, canon);

describe('DexieDestaqueRepository', () => {
  let db: BancoApp;
  let repo: DexieDestaqueRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexieDestaqueRepository(db, canon);
  });
  afterEach(() => db.delete());

  it('grava no formato do schema e reconstitui o destaque', async () => {
    const d = destaque(1, '1:4-2:3', 'ROSA');
    await repo.aplicar({ salvar: [d], remover: [] });

    expect(await db.destaques.toArray()).toEqual([
      {
        id: idDestaque(1),
        versaoId: 'BLIVRE',
        livro: 'JHN',
        capitulo: 3,
        inicio: [1, 4],
        fim: [2, 3],
        cor: 'ROSA',
        criadoEm: d.criadoEm,
      },
    ]);
    const lido = await repo.porId(d.id);
    expect(lido && notacao(lido.intervalo)).toBe('1:4-2:3');
    expect(lido?.capitulo.chave()).toBe('JHN.3');
    expect(lido?.cor).toBe('ROSA');
    expect(lido?.criadoEm).toEqual(d.criadoEm);
  });

  it('lista por versão e capítulo', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-1:3'), destaque(2, '2:0-2:3')], remover: [] });
    await db.destaques.put({
      id: idDestaque(3),
      versaoId: 'ARC',
      livro: 'JHN',
      capitulo: 3,
      inicio: [1, 0],
      fim: [1, 3],
      cor: 'AMARELO',
      criadoEm: new Date(),
    });

    expect((await repo.porCapitulo(BLIVRE, ref('Jo 3'))).map((d) => d.id).sort()).toEqual([
      idDestaque(1),
      idDestaque(2),
    ]);
    expect(await repo.porCapitulo(BLIVRE, ref('Jo 4'))).toEqual([]);
    expect(await repo.porCapitulo(VersaoId.de('ARC'), ref('Jo 3'))).toHaveLength(1);
  });

  it('remove e grava na mesma chamada', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-1:3'), destaque(2, '2:0-2:3')], remover: [] });
    await repo.aplicar({ salvar: [destaque(3, '3:0-3:3')], remover: [idDestaque(1)] });
    expect((await db.destaques.toArray()).map((r) => r.id).sort()).toEqual([
      idDestaque(2),
      idDestaque(3),
    ]);
  });

  it('não grava nada se a transação falha', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-1:3')], remover: [] });
    const quebrado = { ...destaque(2, '2:0-2:3'), id: undefined } as never;
    await expect(repo.aplicar({ salvar: [quebrado], remover: [idDestaque(1)] })).rejects.toThrow();
    expect(await repo.porId(idDestaque(1))).not.toBeNull();
  });

  it.each<[string, Partial<DestaqueRegistro>]>([
    ['id inválido', { id: 'x' }],
    ['cor desconhecida', { cor: 'ROXO' }],
    ['intervalo invertido', { inicio: [2, 0], fim: [1, 0] }],
  ])('ignora registro com %s', async (_caso, mudanca) => {
    await db.destaques.put({
      id: idDestaque(1),
      versaoId: 'BLIVRE',
      livro: 'JHN',
      capitulo: 3,
      inicio: [1, 0],
      fim: [1, 3],
      cor: 'AMARELO',
      criadoEm: new Date(),
      ...mudanca,
    });
    expect(await repo.porCapitulo(BLIVRE, ref('Jo 3'))).toEqual([]);
  });
});

describe('BancoApp — migração v2 → v3', () => {
  it('preserva os favoritos e cria a tabela de destaques', async () => {
    const nome = `teste-${crypto.randomUUID()}`;
    const v2 = new Dexie(nome);
    v2.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
    v2.version(2).stores({ favoritos: 'id, &chave, [livro+capitulo], criadoEm' });
    await v2.table('favoritos').put({
      id: '01890a5d-ac96-774b-bcce-b302099a8051',
      chave: 'JHN.3.16',
      livro: 'JHN',
      capitulo: 3,
      criadoEm: new Date(),
    });
    v2.close();

    const db = new BancoApp(nome);
    expect(await db.favoritos.count()).toBe(1);
    expect(await db.destaques.count()).toBe(0);
    expect(db.verno).toBe(3);
    await db.delete();
  });
});
