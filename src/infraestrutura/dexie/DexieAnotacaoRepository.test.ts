import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Referencia } from '../../dominio/biblia';
import { anotacao, idAnotacao } from '../../test/anotacoes';
import { canon, destaque, idDestaque } from '../../test/destaques';
import { BancoApp, type AnotacaoRegistro } from './BancoApp';
import { DexieAnotacaoRepository } from './DexieAnotacaoRepository';
import { DexieDestaqueRepository } from './DexieDestaqueRepository';

const ref = (t: string) => Referencia.parse(t, canon);

describe('DexieAnotacaoRepository', () => {
  let db: BancoApp;
  let repo: DexieAnotacaoRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexieAnotacaoRepository(db, canon);
  });
  afterEach(() => db.delete());

  it('grava no formato do schema e reconstitui a anotação', async () => {
    const a = anotacao(1, 'Jo 3:16', { destaque: idDestaque(2), exibicao: 'INLINE' });
    await repo.salvar(a);
    expect(await db.anotacoes.toArray()).toEqual([
      {
        id: idAnotacao(1),
        chave: 'JHN.3.16',
        livro: 'JHN',
        capitulo: 3,
        destaqueId: idDestaque(2),
        conteudo: 'Nota 1',
        exibicao: 'INLINE',
        criadoEm: a.criadoEm,
        atualizadoEm: a.atualizadoEm,
      },
    ]);
    const lida = await repo.porId(a.id);
    expect(lida?.referencia.chave()).toBe('JHN.3.16');
    expect([lida?.destaqueId, lida?.exibicao, lida?.conteudo]).toEqual([
      idDestaque(2),
      'INLINE',
      'Nota 1',
    ]);
  });

  it('lista por capítulo, edita e remove', async () => {
    await repo.salvar(anotacao(1, 'Jo 3:16'));
    await repo.salvar(anotacao(2, 'Jo 3:1'));
    await repo.salvar(anotacao(3, 'Jo 4:1'));
    expect((await repo.porCapitulo(ref('Jo 3'))).map((a) => a.id).sort()).toEqual([
      idAnotacao(1),
      idAnotacao(2),
    ]);

    const editada = anotacao(1, 'Jo 3:16').editar('Nova', 'RODAPE', new Date('2026-11-23'));
    await repo.salvar(editada);
    expect((await repo.porId(idAnotacao(1)))?.conteudo).toBe('Nova');

    await repo.remover(idAnotacao(1));
    expect(await repo.porId(idAnotacao(1))).toBeNull();
  });

  it.each<[string, Partial<AnotacaoRegistro>]>([
    ['conteúdo vazio', { conteudo: ' ' }],
    ['modo desconhecido', { exibicao: 'LATERAL' }],
    ['destaque com id inválido', { destaqueId: 'x' }],
  ])('ignora registro com %s', async (_caso, mudanca) => {
    await db.anotacoes.put({
      id: idAnotacao(1),
      chave: 'JHN.3.16',
      livro: 'JHN',
      capitulo: 3,
      destaqueId: null,
      conteudo: 'ok',
      exibicao: 'RODAPE',
      criadoEm: new Date('2026-11-22'),
      atualizadoEm: new Date('2026-11-22'),
      ...mudanca,
    });
    expect(await repo.porCapitulo(ref('Jo 3'))).toEqual([]);
  });

  it('religa as anotações na mesma transação da fusão de destaques', async () => {
    const destaques = new DexieDestaqueRepository(db, canon);
    await repo.salvar(anotacao(1, 'Jo 3:1', { destaque: idDestaque(2) }));
    await repo.salvar(anotacao(2, 'Jo 3:1'));
    await destaques.aplicar({
      salvar: [destaque(1, '1:0-1:11')],
      remover: [idDestaque(2)],
      religar: [{ de: idDestaque(2), para: idDestaque(1) }],
    });
    expect((await repo.porId(idAnotacao(1)))?.destaqueId).toBe(idDestaque(1));
    expect((await repo.porId(idAnotacao(2)))?.destaqueId).toBeNull();
  });
});

describe('BancoApp — migração v3 → v4', () => {
  it('preserva os destaques e cria a tabela de anotações', async () => {
    const nome = `teste-${crypto.randomUUID()}`;
    const v3 = new Dexie(nome);
    v3.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
    v3.version(2).stores({ favoritos: 'id, &chave, [livro+capitulo], criadoEm' });
    v3.version(3).stores({ destaques: 'id, [versaoId+livro+capitulo], criadoEm' });
    await v3.table('destaques').put({ id: idDestaque(1), versaoId: 'BLIVRE' });
    v3.close();

    const db = new BancoApp(nome);
    expect(await db.destaques.count()).toBe(1);
    expect(await db.anotacoes.count()).toBe(0);
    expect(db.verno).toBe(4);
    await db.delete();
  });
});
