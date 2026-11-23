import { describe, expect, it } from 'vitest';
import { Canon, Capitulo, CodigoLivro, Referencia, VersaoId } from '../biblia';
import { IntervaloTexto, IntervaloTextoInvalidoError, PosicaoTexto } from './IntervaloTexto';
import { TextoDoCapitulo } from './TextoDoCapitulo';

const canon = new Canon();
const capitulo = Capitulo.criar(VersaoId.de('BLIVRE'), canon.livro(CodigoLivro.de('JHN')), 3, [
  [16, 'Porque Deus amou o mundo, de tal maneira '],
  [17, 'Disse-lhe Jesus: crê.'],
  [19, ' E esta é a condenação'],
]);
const texto = new TextoDoCapitulo(capitulo);
const pos = (v: number, offset: number) =>
  PosicaoTexto.em(Referencia.parse(`Jo 3:${v}`, canon), offset);
const int = (va: number, oa: number, vb: number, ob: number) =>
  IntervaloTexto.criar(pos(va, oa), pos(vb, ob));
const fmt = (i: IntervaloTexto | null) =>
  i && `${i.inicio.numero}:${i.inicio.offset}-${i.fim.numero}:${i.fim.offset}`;

describe('TextoDoCapitulo', () => {
  describe('validar', () => {
    it('aceita offsets até o fim do texto', () => {
      expect(() => texto.validar(int(16, 0, 17, 21))).not.toThrow();
    });

    it.each([
      ['versículo inexistente (lacuna)', () => int(18, 0, 18, 2)],
      ['offset além do texto', () => int(17, 0, 17, 22)],
      [
        'outro capítulo',
        () =>
          IntervaloTexto.criar(
            PosicaoTexto.em(Referencia.parse('Jo 4:1', canon), 0),
            PosicaoTexto.em(Referencia.parse('Jo 4:1', canon), 2),
          ),
      ],
    ])('rejeita %s', (_caso, intervalo) => {
      expect(() => texto.validar(intervalo())).toThrow(IntervaloTextoInvalidoError);
    });
  });

  describe('ajustarAPalavras', () => {
    it('estende as pontas que caem no meio de palavras', () => {
      // "Porque Deus amou" ← de "que De" (offsets 3–9)
      const ajustado = texto.ajustarAPalavras(int(16, 3, 16, 9));
      expect(fmt(ajustado)).toBe('16:0-16:11');
      expect(ajustado && texto.trecho(ajustado)).toBe('Porque Deus');
    });

    it('mantém pontuação selecionada e não estende além dela', () => {
      expect(texto.trecho(texto.ajustarAPalavras(int(16, 20, 16, 25)) ?? int(16, 0, 16, 1))).toBe(
        'mundo,',
      );
    });

    it('trata palavras com hífen como uma só', () => {
      expect(fmt(texto.ajustarAPalavras(int(17, 2, 17, 7)))).toBe('17:0-17:9');
    });

    it('descarta espaços nas pontas e a passagem entre versículos', () => {
      // só o espaço final do v.16 e a passagem para o v.17
      expect(texto.ajustarAPalavras(int(16, 40, 17, 0))).toBeNull();
      // termina no offset 0 do v.17 → recua para o fim do v.16 e apara o espaço
      expect(fmt(texto.ajustarAPalavras(int(16, 33, 17, 0)))).toBe('16:33-16:40');
      // começa no espaço inicial do v.19
      expect(fmt(texto.ajustarAPalavras(int(19, 0, 19, 3)))).toBe('19:1-19:2');
    });

    it('cobre vários versículos', () => {
      const ajustado = texto.ajustarAPalavras(int(16, 34, 17, 3));
      expect(ajustado && texto.trecho(ajustado)).toBe('maneira Disse-lhe');
    });
  });

  it('diz se entre duas posições só há espaço', () => {
    expect(texto.soEspacoEntre(pos(16, 11), pos(16, 12))).toBe(true);
    expect(texto.soEspacoEntre(pos(16, 40), pos(17, 0))).toBe(true);
    expect(texto.soEspacoEntre(pos(17, 21), pos(19, 1))).toBe(true);
    expect(texto.soEspacoEntre(pos(16, 10), pos(16, 12))).toBe(false);
    expect(texto.soEspacoEntre(pos(16, 12), pos(16, 11))).toBe(false);
  });

  it('dá o intervalo do versículo inteiro', () => {
    expect(fmt(texto.intervaloDoVersiculo(17))).toBe('17:0-17:21');
    expect(texto.intervaloDoVersiculo(18)).toBeNull();
  });
});
