import { describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../biblia';
import { Favorito, FavoritoId } from './Favorito';
import { MarcacoesDoCapitulo } from './MarcacoesDoCapitulo';

const canon = new Canon();
const ref = (t: string) => Referencia.parse(t, canon);
const favorito = (t: string, n: number) =>
  Favorito.criar(
    FavoritoId.de(`01890a5d-ac96-774b-bcce-b302099a805${n}`),
    ref(t),
    new Date('2026-11-22T10:00:00Z'),
  );

describe('MarcacoesDoCapitulo', () => {
  it('indica os versículos favoritados do capítulo', () => {
    const m = new MarcacoesDoCapitulo(ref('Jo 3'), [favorito('Jo 3:16', 1), favorito('Jo 3:3', 2)]);
    expect(m.favoritado(16)).toBe(true);
    expect(m.favoritado(3)).toBe(true);
    expect(m.favoritado(17)).toBe(false);
    expect(m.favoritos).toHaveLength(2);
  });

  it('ignora favoritos de outro capítulo', () => {
    const m = new MarcacoesDoCapitulo(ref('Jo 3'), [favorito('Jo 4:16', 1)]);
    expect(m.favoritado(16)).toBe(false);
  });

  it('cria marcações vazias', () => {
    const m = MarcacoesDoCapitulo.vazias(ref('Jo 3'));
    expect(m.favoritos).toEqual([]);
    expect(m.capitulo.chave()).toBe('JHN.3');
  });
});
