import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { livroSintetico } from '../../test/fakes';
import { BancoApp } from './BancoApp';
import { DexieTextoBiblicoRepository } from './DexieTextoBiblicoRepository';

const canon = new Canon();
const blivre = VersaoId.de('BLIVRE');
const ref = (texto: string) => Referencia.parse(texto, canon);

describe('DexieTextoBiblicoRepository', () => {
  let db: BancoApp;
  let repo: DexieTextoBiblicoRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexieTextoBiblicoRepository(db, canon);
  });
  afterEach(() => db.delete());

  it('importa e lê capítulos por versão, livro e número', async () => {
    expect(await repo.possuiVersao(blivre)).toBe(false);
    await repo.importar(blivre, [livroSintetico(canon, 'JHN'), livroSintetico(canon, 'JUD')]);

    expect(await repo.possuiVersao(blivre)).toBe(true);
    expect(await db.capitulos.count()).toBe(21 + 1);

    const jo3 = await repo.obterCapitulo(blivre, ref('Jo 3'));
    expect(jo3?.referencia.chave()).toBe('JHN.3');
    expect(jo3?.versiculo(2)?.texto).toBe('JHN 3:2');
    expect(await repo.obterCapitulo(blivre, ref('Gn 1'))).toBeNull();
    expect(await repo.obterCapitulo(VersaoId.de('TB'), ref('Jo 3'))).toBeNull();
  });

  it('reimportar substitui os capítulos da versão', async () => {
    await repo.importar(blivre, [livroSintetico(canon, 'JHN')]);
    await repo.importar(blivre, [livroSintetico(canon, 'JUD')]);
    expect(await repo.obterCapitulo(blivre, ref('Jo 3'))).toBeNull();
    expect(await db.capitulos.count()).toBe(1);
  });

  it('importação é atômica: falha não deixa versão parcial nem apaga a anterior', async () => {
    await repo.importar(blivre, [livroSintetico(canon, 'JUD')]);
    vi.spyOn(db.capitulos, 'bulkPut').mockRejectedValueOnce(new Error('cota excedida'));

    await expect(repo.importar(blivre, [livroSintetico(canon, 'JHN')])).rejects.toThrow(
      'cota excedida',
    );
    expect(await repo.obterCapitulo(blivre, ref('Jd 1'))).not.toBeNull();

    const tb = VersaoId.de('TB');
    vi.spyOn(db.capitulos, 'bulkPut').mockRejectedValueOnce(new Error('cota excedida'));
    await expect(repo.importar(tb, [livroSintetico(canon, 'JHN')])).rejects.toThrow();
    expect(await repo.possuiVersao(tb)).toBe(false);
  });
});
