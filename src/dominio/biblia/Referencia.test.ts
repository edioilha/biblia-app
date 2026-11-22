import { describe, expect, it } from 'vitest';
import { Canon } from './Canon';
import { CodigoLivro, CodigoLivroInvalidoError } from './CodigoLivro';
import { Referencia, ReferenciaInvalidaError } from './Referencia';

const canon = new Canon();
const joao = canon.livro(CodigoLivro.de('JHN'));

describe('Referencia', () => {
  describe('parse', () => {
    it.each([
      ['Jo 3:16', 'JHN.3.16'],
      ['joão 3.16', 'JHN.3.16'],
      ['jo 3,16', 'JHN.3.16'],
      ['  Jo   3 : 16  ', 'JHN.3.16'],
      ['jo 3', 'JHN.3'],
      ['João', 'JHN.1'],
      ['Jó 1:1', 'JOB.1.1'],
      ['1 Co 13', '1CO.13'],
      ['1co13:4', '1CO.13.4'],
      ['sl 119:105', 'PSA.119.105'],
      ['Lamentações de Jeremias 3:22', 'LAM.3.22'],
      ['ap 22:21', 'REV.22.21'],
    ])('"%s" → %s', (entrada, chave) => {
      expect(Referencia.parse(entrada, canon).chave()).toBe(chave);
    });

    it('rejeita entrada vazia ou sem livro', () => {
      expect(() => Referencia.parse('', canon)).toThrow(ReferenciaInvalidaError);
      expect(() => Referencia.parse('3:16', canon)).toThrow(ReferenciaInvalidaError);
    });

    it('rejeita capítulo inexistente', () => {
      expect(() => Referencia.parse('Jo 22', canon)).toThrow(/João tem 21 capítulo/);
      expect(() => Referencia.parse('Ob 2', canon)).toThrow(ReferenciaInvalidaError);
    });

    it('rejeita versículo zero', () => {
      expect(() => Referencia.parse('Jo 3:0', canon)).toThrow(/Versículo inválido/);
    });
  });

  it('formata para exibição', () => {
    expect(Referencia.versiculo(joao, 3, 16).formatar(joao)).toBe('João 3:16');
    expect(Referencia.capitulo(joao, 3).formatar(joao)).toBe('João 3');
  });

  it('compara por valor (value object)', () => {
    expect(Referencia.parse('Jo 3:16', canon).equals(Referencia.versiculo(joao, 3, 16))).toBe(true);
    expect(Referencia.parse('Jo 3:16', canon).equals(Referencia.capitulo(joao, 3))).toBe(false);
  });

  it('ordena pela ordem canônica', () => {
    const ordenadas = ['Ap 1', 'Jo 3:16', 'Gn 1', 'Jo 3', 'Jo 3:2']
      .map((t) => Referencia.parse(t, canon))
      .sort((a, b) => a.compararCom(b, canon))
      .map((r) => r.chave());
    expect(ordenadas).toEqual(['GEN.1', 'JHN.3', 'JHN.3.2', 'JHN.3.16', 'REV.1']);
  });

  it('CodigoLivro rejeita código desconhecido', () => {
    expect(() => CodigoLivro.de('XYZ')).toThrow(CodigoLivroInvalidoError);
    expect(CodigoLivro.de(' jhn ').valor).toBe('JHN');
  });
});

describe('Referencia.doCapitulo', () => {
  it('remove o versículo e mantém referências de capítulo', () => {
    const r = Referencia.parse('Jo 3:16', canon);
    expect(r.doCapitulo().chave()).toBe('JHN.3');
    const c = Referencia.parse('Jo 3', canon);
    expect(c.doCapitulo()).toBe(c);
  });
});

describe('Referencia.deChave', () => {
  it.each(['JHN.3', 'JHN.3.16', 'GEN.1', 'REV.22.21'])(
    'faz o caminho inverso de chave(): %s',
    (chave) => {
      expect(Referencia.deChave(chave, canon).chave()).toBe(chave);
    },
  );

  it.each(['', 'JHN', 'JHN.3.16.1', 'JHN.x', 'JHN.22', 'JHN.3.0'])('rejeita %j', (chave) => {
    expect(() => Referencia.deChave(chave, canon)).toThrow();
  });
});
