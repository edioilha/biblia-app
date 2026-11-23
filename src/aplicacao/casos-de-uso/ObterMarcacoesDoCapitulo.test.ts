import { describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../../dominio/biblia';
import { FavoritosEmMemoria, GeradorIdSequencial, RelogioFixo } from '../../test/fakes';
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
    const uc = new ObterMarcacoesDoCapitulo(repo);

    const m = await uc.executar(ref('Jo 3:2'));
    expect(m.capitulo.chave()).toBe('JHN.3');
    expect(m.favoritos.map((f) => f.referencia.chave())).toEqual(['JHN.3.16']);
    expect(m.favoritado(16)).toBe(true);
    expect(m.favoritado(1)).toBe(false);
  });
});
