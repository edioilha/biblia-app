import { describe, expect, it } from 'vitest';
import {
  converterLivro,
  DadosInvalidosError,
  normalizarTexto,
  type LivroOrigem,
} from './normalizar.ts';

describe('normalizarTexto', () => {
  it.each([
    ['No princípio era a Palavra,  e a Palavra ', 'No princípio era a Palavra, e a Palavra'],
    ['com a vassoura da destruição,diz o SENHOR', 'com a vassoura da destruição, diz o SENHOR'],
    ['fujam de mim.Porém seu escudeiro', 'fujam de mim. Porém seu escudeiro'],
    ['Senhor?E ele disse: Ananias!E ele', 'Senhor? E ele disse: Ananias! E ele'],
    ['tempos. (Selá)Porque eles', 'tempos. (Selá) Porque eles'],
    ['poças d´água', 'poças d’água'],
    ['tinha.»  ', 'tinha.»'],
  ])('%j → %j', (entrada, esperado) => {
    expect(normalizarTexto(entrada)).toBe(esperado);
  });

  it('remove markup de nota de rodapé vazado', () => {
    expect(
      normalizarTexto(
        'a falha é deles./fn/keyCorromperam-se... é deles/*keyobscuro/*fn São uma geração perversa.',
      ),
    ).toBe('a falha é deles. São uma geração perversa.');
  });

  it('não altera números de referência nem pontuação seguida de espaço', () => {
    expect(normalizarTexto('Jo 3:16, isto é, 1.000 anos.')).toBe('Jo 3:16, isto é, 1.000 anos.');
  });
});

describe('converterLivro', () => {
  const origem = (capitulos: LivroOrigem['chapters'], code = 'JUD'): LivroOrigem => ({
    id: 65,
    code,
    name: 'Judas',
    abbrev: 'Jd',
    chapters: capitulos,
  });
  const esperado = { codigo: 'JUD', totalCapitulos: 1 };

  it('converte para o formato embarcado preservando lacunas de numeração', () => {
    const livro = converterLivro(
      origem([
        {
          number: 1,
          verses: [
            { number: 1, text: ' Judas,  servo ' },
            { number: 2, text: 'Misericórdia' },
            { number: 4, text: 'Porque' },
          ],
        },
      ]),
      esperado,
    );
    expect(livro).toEqual({
      formato: 1,
      livro: 'JUD',
      capitulos: [
        [
          [1, 'Judas, servo'],
          [2, 'Misericórdia'],
          [4, 'Porque'],
        ],
      ],
    });
  });

  it.each<[string, LivroOrigem]>([
    ['código errado', origem([{ number: 1, verses: [{ number: 1, text: 'x' }] }], 'JHN')],
    ['total de capítulos', origem([])],
    ['capítulo fora de ordem', origem([{ number: 2, verses: [{ number: 1, text: 'x' }] }])],
    ['capítulo vazio', origem([{ number: 1, verses: [] }])],
    [
      'versículo fora de ordem',
      origem([
        {
          number: 1,
          verses: [
            { number: 2, text: 'x' },
            { number: 1, text: 'y' },
          ],
        },
      ]),
    ],
    ['versículo vazio', origem([{ number: 1, verses: [{ number: 1, text: '   ' }] }])],
  ])('rejeita dados inválidos: %s', (_, dados) => {
    expect(() => converterLivro(dados, esperado)).toThrow(DadosInvalidosError);
  });
});
