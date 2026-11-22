import { describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../biblia';
import { Favorito, FavoritoId, FavoritoIdInvalidoError, FavoritoInvalidoError } from './Favorito';

const canon = new Canon();
const ref = (t: string) => Referencia.parse(t, canon);
const ID = '01890a5d-ac96-774b-bcce-b302099a8057';

describe('FavoritoId', () => {
  it('aceita UUID e normaliza para minúsculas', () => {
    expect(FavoritoId.de(` ${ID.toUpperCase()} `)).toBe(ID);
  });

  it.each(['', 'abc', `${ID}0`, ID.replaceAll('-', '')])('rejeita "%s"', (valor) => {
    expect(() => FavoritoId.de(valor)).toThrow(FavoritoIdInvalidoError);
  });
});

describe('Favorito', () => {
  it('guarda id, referência do versículo e data de criação', () => {
    const criadoEm = new Date('2026-11-22T10:00:00Z');
    const f = Favorito.criar(FavoritoId.de(ID), ref('Jo 3:16'), criadoEm);
    expect(f.id).toBe(ID);
    expect(f.referencia.chave()).toBe('JHN.3.16');
    expect(f.criadoEm).toEqual(criadoEm);
  });

  it('copia a data (imutável por fora)', () => {
    const criadoEm = new Date('2026-11-22T10:00:00Z');
    const f = Favorito.criar(FavoritoId.de(ID), ref('Jo 3:16'), criadoEm);
    criadoEm.setFullYear(2000);
    expect(f.criadoEm.getFullYear()).toBe(2026);
  });

  it('exige um versículo, não um capítulo', () => {
    expect(() => Favorito.criar(FavoritoId.de(ID), ref('Jo 3'), new Date())).toThrow(
      FavoritoInvalidoError,
    );
  });

  it('rejeita data inválida', () => {
    expect(() => Favorito.criar(FavoritoId.de(ID), ref('Jo 3:16'), new Date('x'))).toThrow(
      FavoritoInvalidoError,
    );
  });
});
