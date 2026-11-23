import { describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../biblia';
import { IntervaloTexto, IntervaloTextoInvalidoError, PosicaoTexto } from './IntervaloTexto';

const canon = new Canon();
const pos = (v: string, offset: number) => PosicaoTexto.em(Referencia.parse(v, canon), offset);
/** "16:3-17:5" → Jo 3:16 offset 3 até Jo 3:17 offset 5. */
const int = (texto: string) => {
  const [a = '', b = ''] = texto.split('-');
  const [va, oa] = a.split(':').map(Number);
  const [vb, ob] = b.split(':').map(Number);
  return IntervaloTexto.criar(pos(`Jo 3:${va}`, oa ?? 0), pos(`Jo 3:${vb}`, ob ?? 0));
};
const fmt = (i: IntervaloTexto) =>
  `${i.inicio.numero}:${i.inicio.offset}-${i.fim.numero}:${i.fim.offset}`;

describe('PosicaoTexto', () => {
  it('compara por versículo e depois por offset', () => {
    expect(pos('Jo 3:16', 9).compararCom(pos('Jo 3:17', 0))).toBeLessThan(0);
    expect(pos('Jo 3:16', 9).compararCom(pos('Jo 3:16', 2))).toBeGreaterThan(0);
    expect(pos('Jo 3:16', 2).equals(pos('Jo 3:16', 2))).toBe(true);
  });

  it('exige versículo e offset inteiro não negativo', () => {
    expect(() => pos('Jo 3', 0)).toThrow(IntervaloTextoInvalidoError);
    expect(() => pos('Jo 3:16', -1)).toThrow(IntervaloTextoInvalidoError);
    expect(() => pos('Jo 3:16', 1.5)).toThrow(IntervaloTextoInvalidoError);
  });

  it('não compara posições de capítulos diferentes', () => {
    expect(() => pos('Jo 3:16', 0).compararCom(pos('Jo 4:1', 0))).toThrow(
      IntervaloTextoInvalidoError,
    );
  });
});

describe('IntervaloTexto', () => {
  it('exige início antes do fim e um único capítulo', () => {
    expect(() => int('16:5-16:5')).toThrow(IntervaloTextoInvalidoError);
    expect(() => int('17:0-16:5')).toThrow(IntervaloTextoInvalidoError);
    expect(() => IntervaloTexto.criar(pos('Jo 3:36', 0), pos('Jo 4:1', 3))).toThrow(
      IntervaloTextoInvalidoError,
    );
    expect(int('16:0-17:3').capitulo.chave()).toBe('JHN.3');
  });

  it('sobrepõe só quando há caracteres em comum', () => {
    expect(int('16:0-16:10').sobrepoe(int('16:9-17:2'))).toBe(true);
    expect(int('16:0-16:10').sobrepoe(int('16:10-17:2'))).toBe(false);
    expect(int('16:3-16:4').sobrepoe(int('16:0-18:0'))).toBe(true);
  });

  it('une cobrindo os dois', () => {
    expect(fmt(int('16:5-16:10').unir(int('16:8-17:2')))).toBe('16:5-17:2');
    expect(fmt(int('17:0-17:2').unir(int('16:1-16:3')))).toBe('16:1-17:2');
  });

  it('subtrai deixando zero, um ou dois pedaços', () => {
    expect(int('16:0-16:10').subtrair(int('16:0-17:0'))).toEqual([]);
    expect(int('16:0-16:10').subtrair(int('16:5-17:0')).map(fmt)).toEqual(['16:0-16:5']);
    expect(int('16:0-18:4').subtrair(int('17:1-17:3')).map(fmt)).toEqual([
      '16:0-17:1',
      '17:3-18:4',
    ]);
    expect(int('16:0-16:3').subtrair(int('17:0-17:3')).map(fmt)).toEqual(['16:0-16:3']);
  });

  it('dá o trecho coberto em cada versículo', () => {
    const i = int('16:5-18:4');
    expect(i.trechoNoVersiculo(15, 20)).toBeNull();
    expect(i.trechoNoVersiculo(16, 20)).toEqual({ de: 5, ate: 20 });
    expect(i.trechoNoVersiculo(17, 12)).toEqual({ de: 0, ate: 12 });
    expect(i.trechoNoVersiculo(18, 30)).toEqual({ de: 0, ate: 4 });
    expect(int('16:0-17:0').trechoNoVersiculo(17, 10)).toBeNull();
    expect(int('16:5-16:9').trechoNoVersiculo(16, 7)).toEqual({ de: 5, ate: 7 });
  });
});
