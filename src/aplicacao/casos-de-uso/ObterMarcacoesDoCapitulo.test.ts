import { describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { BLIVRE, destaque } from '../../test/destaques';
import {
  DestaquesEmMemoria,
  FavoritosEmMemoria,
  GeradorIdSequencial,
  RelogioFixo,
} from '../../test/fakes';
import { AlternarFavorito } from './AlternarFavorito';
import { ObterMarcacoesDoCapitulo } from './ObterMarcacoesDoCapitulo';

const canon = new Canon();
const ref = (t: string) => Referencia.parse(t, canon);

describe('ObterMarcacoesDoCapitulo', () => {
  it('devolve os favoritos do capítulo, a partir de capítulo ou versículo', async () => {
    const repo = new FavoritosEmMemoria();
    const alternar = new AlternarFavorito(repo, new RelogioFixo(), new GeradorIdSequencial());
    await alternar.executar(ref('Jo 3:16'));
    await alternar.executar(ref('Jo 4:1'));
    const uc = new ObterMarcacoesDoCapitulo(repo, new DestaquesEmMemoria());

    const m = await uc.executar(BLIVRE, ref('Jo 3:2'));
    expect(m.capitulo.chave()).toBe('JHN.3');
    expect(m.favoritos.map((f) => f.referencia.chave())).toEqual(['JHN.3.16']);
    expect(m.favoritado(16)).toBe(true);
    expect(m.favoritado(1)).toBe(false);
  });

  it('devolve os destaques da versão exibida', async () => {
    const destaques = new DestaquesEmMemoria();
    await destaques.aplicar({ salvar: [destaque(1, '1:0-1:3')], remover: [] });
    const uc = new ObterMarcacoesDoCapitulo(new FavoritosEmMemoria(), destaques);

    expect((await uc.executar(BLIVRE, ref('Jo 3'))).destaques).toHaveLength(1);
    expect((await uc.executar(VersaoId.de('ARC'), ref('Jo 3'))).destaques).toEqual([]);
    expect((await uc.executar(BLIVRE, ref('Jo 4'))).destaques).toEqual([]);
  });
});
