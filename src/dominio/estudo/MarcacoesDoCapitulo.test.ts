import { describe, expect, it } from 'vitest';
import { destaque } from '../../test/destaques';
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

  it('dá as faixas destacadas de cada versículo, em ordem', () => {
    const m = new MarcacoesDoCapitulo(
      ref('Jo 3'),
      [],
      [destaque(2, '2:4-3:3', 'ROSA'), destaque(1, '1:0-1:3'), destaque(3, '1:8-2:3')],
    );
    expect(m.destaques.map((d) => d.cor)).toEqual(['AMARELO', 'AMARELO', 'ROSA']);
    expect(m.faixasDestacadas(1, 15).map(({ de, ate }) => [de, ate])).toEqual([
      [0, 3],
      [8, 15],
    ]);
    expect(m.faixasDestacadas(2, 11)).toEqual([
      { de: 0, ate: 3, cor: 'AMARELO', destaque: m.destaques[1]?.id },
      { de: 4, ate: 11, cor: 'ROSA', destaque: m.destaques[2]?.id },
    ]);
    expect(m.faixasDestacadas(4, 10)).toEqual([]);
    expect(m.destaque(m.destaques[0]?.id ?? ('' as never))?.cor).toBe('AMARELO');
  });
});
