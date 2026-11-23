import { beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../../dominio/biblia';
import { FavoritoInvalidoError } from '../../dominio/estudo';
import { FavoritosEmMemoria, GeradorIdSequencial, RelogioFixo } from '../../test/fakes';
import { AlternarFavorito } from './AlternarFavorito';

const canon = new Canon();
const ref = (t: string) => Referencia.parse(t, canon);

describe('AlternarFavorito (UC04)', () => {
  let repo: FavoritosEmMemoria;
  let relogio: RelogioFixo;
  let uc: AlternarFavorito;

  beforeEach(() => {
    repo = new FavoritosEmMemoria();
    relogio = new RelogioFixo();
    uc = new AlternarFavorito(repo, relogio, new GeradorIdSequencial());
  });

  it('favorita o versículo com id e data', async () => {
    expect(await uc.executar(ref('Jo 3:16'))).toBe(true);
    const [f] = repo.itens.values();
    expect(f?.id).toBe('00000000-0000-7000-8000-000000000001');
    expect(f?.referencia.chave()).toBe('JHN.3.16');
    expect(f?.criadoEm).toEqual(relogio.instante);
  });

  it('desmarca quando já é favorito', async () => {
    await uc.executar(ref('Jo 3:16'));
    expect(await uc.executar(ref('Jo 3:16'))).toBe(false);
    expect(repo.itens.size).toBe(0);
  });

  it('mantém no máximo um favorito por versículo', async () => {
    await uc.executar(ref('Jo 3:16'));
    await uc.executar(ref('Jo 3:17'));
    await uc.executar(ref('Jo 3:16'));
    await uc.executar(ref('Jo 3:16'));
    expect([...repo.itens.values()].map((f) => f.referencia.chave()).sort()).toEqual([
      'JHN.3.16',
      'JHN.3.17',
    ]);
  });

  it('rejeita referência de capítulo', async () => {
    await expect(uc.executar(ref('Jo 3'))).rejects.toThrow(FavoritoInvalidoError);
    expect(repo.itens.size).toBe(0);
  });
});
