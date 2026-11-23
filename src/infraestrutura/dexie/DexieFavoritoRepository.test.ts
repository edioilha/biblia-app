import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../../dominio/biblia';
import { Favorito, FavoritoId } from '../../dominio/estudo';
import { BancoApp } from './BancoApp';
import { DexieFavoritoRepository } from './DexieFavoritoRepository';

const canon = new Canon();
const ref = (t: string) => Referencia.parse(t, canon);
const criadoEm = new Date('2026-11-22T10:00:00Z');
const favorito = (t: string, n: number) =>
  Favorito.criar(FavoritoId.de(`01890a5d-ac96-774b-bcce-b302099a805${n}`), ref(t), criadoEm);

describe('DexieFavoritoRepository', () => {
  let db: BancoApp;
  let repo: DexieFavoritoRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexieFavoritoRepository(db, canon);
  });
  afterEach(() => db.delete());

  it('salva e lê por referência e por capítulo', async () => {
    await repo.salvar(favorito('Jo 3:16', 1));
    await repo.salvar(favorito('Jo 3:3', 2));
    await repo.salvar(favorito('Jo 4:1', 3));

    const f = await repo.porReferencia(ref('Jo 3:16'));
    expect(f?.id).toBe('01890a5d-ac96-774b-bcce-b302099a8051');
    expect(f?.criadoEm).toEqual(criadoEm);
    expect(await repo.porReferencia(ref('Jo 3:17'))).toBeNull();

    const doCapitulo = await repo.porCapitulo(ref('Jo 3'));
    expect(doCapitulo.map((x) => x.referencia.chave()).sort()).toEqual(['JHN.3.16', 'JHN.3.3']);
  });

  it('grava o registro no formato do schema', async () => {
    await repo.salvar(favorito('Jo 3:16', 1));
    expect(await db.favoritos.toArray()).toEqual([
      {
        id: '01890a5d-ac96-774b-bcce-b302099a8051',
        chave: 'JHN.3.16',
        livro: 'JHN',
        capitulo: 3,
        criadoEm,
      },
    ]);
  });

  it('remove pelo id', async () => {
    const f = favorito('Jo 3:16', 1);
    await repo.salvar(f);
    await repo.remover(f.id);
    expect(await repo.porReferencia(ref('Jo 3:16'))).toBeNull();
  });

  it('impede dois favoritos para o mesmo versículo (índice único)', async () => {
    await repo.salvar(favorito('Jo 3:16', 1));
    await expect(repo.salvar(favorito('Jo 3:16', 2))).rejects.toThrow(Dexie.ConstraintError);
  });

  it('ignora registros inválidos', async () => {
    await db.favoritos.put({
      id: 'quebrado',
      chave: 'JHN.3.16',
      livro: 'JHN',
      capitulo: 3,
      criadoEm,
    });
    expect(await repo.porCapitulo(ref('Jo 3'))).toEqual([]);
    expect(await repo.porReferencia(ref('Jo 3:16'))).toBeNull();
  });
});

describe('BancoApp — migração a partir da v1', () => {
  it('preserva os dados da v1 e cria as tabelas novas', async () => {
    const nome = `teste-${crypto.randomUUID()}`;
    const v1 = new Dexie(nome);
    v1.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
    await v1
      .table('preferencias')
      .put({ id: 'usuario', versaoAtiva: 'BLIVRE', ultimaPosicao: 'JHN.3' });
    v1.close();

    const db = new BancoApp(nome);
    expect(await db.preferencias.get('usuario')).toMatchObject({ ultimaPosicao: 'JHN.3' });
    expect(await db.favoritos.count()).toBe(0);
    expect(await db.destaques.count()).toBe(0);
    expect(db.verno).toBe(3);
    await db.delete();
  });
});
