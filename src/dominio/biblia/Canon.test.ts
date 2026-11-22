import { describe, expect, it } from 'vitest';
import { Canon, LivroAmbiguoError, LivroNaoEncontradoError } from './Canon';
import { CodigoLivro } from './CodigoLivro';
import { Referencia } from './Referencia';
import { Testamento } from './Testamento';

const canon = new Canon();
const ref = (texto: string) => Referencia.parse(texto, canon);

describe('Canon', () => {
  it('contém os 66 livros e 1189 capítulos, em ordem canônica', () => {
    const livros = canon.livros();
    expect(livros).toHaveLength(66);
    expect(livros.reduce((soma, l) => soma + l.totalCapitulos, 0)).toBe(1189);
    expect(livros[0]?.nome).toBe('Gênesis');
    expect(livros[65]?.nome).toBe('Apocalipse');
    expect(livros.map((l) => l.ordem)).toEqual(livros.map((_, i) => i + 1));
  });

  it('separa Antigo (39) e Novo Testamento (27)', () => {
    const at = canon.livros().filter((l) => l.testamento === Testamento.ANTIGO);
    expect(at).toHaveLength(39);
    expect(at.at(-1)?.nome).toBe('Malaquias');
    expect(canon.livro(CodigoLivro.de('MAT')).testamento).toBe(Testamento.NOVO);
  });

  describe('porNomeOuAbreviacao', () => {
    it.each([
      ['Jo', 'João'],
      ['jo', 'João'],
      ['Jó', 'Jó'],
      ['jó', 'Jó'],
      ['joão', 'João'],
      ['joao', 'João'],
      ['JOÃO', 'João'],
      ['Gn', 'Gênesis'],
      ['genesis', 'Gênesis'],
      ['1 Co', '1 Coríntios'],
      ['1co', '1 Coríntios'],
      ['1 coríntios', '1 Coríntios'],
      ['1 Jo', '1 João'],
      ['sl', 'Salmos'],
      ['Êx', 'Êxodo'],
      ['ex', 'Êxodo'],
      ['apoc', 'Apocalipse'],
      ['lamentações de jeremias', 'Lamentações de Jeremias'],
    ])('"%s" → %s', (entrada, esperado) => {
      expect(canon.porNomeOuAbreviacao(entrada).nome).toBe(esperado);
    });

    it('rejeita prefixo ambíguo', () => {
      expect(() => canon.porNomeOuAbreviacao('ju')).toThrow(LivroAmbiguoError); // Juízes, Judas
    });

    it('rejeita livro inexistente', () => {
      expect(() => canon.porNomeOuAbreviacao('xyz')).toThrow(LivroNaoEncontradoError);
      expect(() => canon.porNomeOuAbreviacao('   ')).toThrow(LivroNaoEncontradoError);
    });
  });

  describe('navegação entre capítulos', () => {
    it('avança dentro do livro e atravessa para o próximo livro', () => {
      expect(canon.proximo(ref('Jo 3'))?.chave()).toBe('JHN.4');
      expect(canon.proximo(ref('Ml 4'))?.chave()).toBe('MAT.1');
    });

    it('volta dentro do livro e atravessa para o livro anterior', () => {
      expect(canon.anterior(ref('Jo 3'))?.chave()).toBe('JHN.2');
      expect(canon.anterior(ref('Mt 1'))?.chave()).toBe('MAL.4');
    });

    it('para nos limites do cânon', () => {
      expect(canon.anterior(ref('Gn 1'))).toBeNull();
      expect(canon.proximo(ref('Ap 22'))).toBeNull();
    });
  });
});
