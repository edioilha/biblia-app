import { describe, expect, it } from 'vitest';
import { Canon } from './Canon';
import { Capitulo, CapituloInvalidoError } from './Capitulo';
import { CodigoLivro } from './CodigoLivro';
import { ReferenciaInvalidaError } from './Referencia';
import { VersaoId } from './Versao';

const canon = new Canon();
const salmos = canon.livro(CodigoLivro.de('PSA'));
const blivre = VersaoId.de('BLIVRE');

describe('Capitulo', () => {
  const sl46 = Capitulo.criar(blivre, salmos, 46, [
    [1, 'Deus é o nosso refúgio'],
    [2, 'Por isso não temeremos'],
    [4, 'Há um rio'],
  ]);

  it('expõe referência, livro e número', () => {
    expect(sl46.referencia.chave()).toBe('PSA.46');
    expect(sl46.livro.valor).toBe('PSA');
    expect(sl46.numero).toBe(46);
    expect(sl46.versaoId).toBe('BLIVRE');
  });

  it('preserva lacunas na numeração dos versículos', () => {
    expect(sl46.versiculos.map((v) => v.numero)).toEqual([1, 2, 4]);
    expect(sl46.versiculo(4)?.texto).toBe('Há um rio');
    expect(sl46.versiculo(4)?.referencia.chave()).toBe('PSA.46.4');
    expect(sl46.versiculo(3)).toBeUndefined();
  });

  it('rejeita capítulo inexistente, vazio ou fora de ordem', () => {
    expect(() => Capitulo.criar(blivre, salmos, 151, [[1, 'x']])).toThrow(ReferenciaInvalidaError);
    expect(() => Capitulo.criar(blivre, salmos, 1, [])).toThrow(CapituloInvalidoError);
    expect(() =>
      Capitulo.criar(blivre, salmos, 1, [
        [2, 'a'],
        [2, 'b'],
      ]),
    ).toThrow(CapituloInvalidoError);
  });
});
