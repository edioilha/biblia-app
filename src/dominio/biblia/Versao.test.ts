import { describe, expect, it } from 'vitest';
import { Versao, VersaoId, VersaoIdInvalidoError } from './Versao';

describe('VersaoId', () => {
  it('normaliza a sigla para maiúsculas', () => {
    expect(VersaoId.de(' blivre ')).toBe('BLIVRE');
    expect(VersaoId.de('ALM1911')).toBe('ALM1911');
  });

  it.each(['', 'X', '1TB', 'BL-IVRE', 'A'.repeat(17)])('rejeita %j', (valor) => {
    expect(() => VersaoId.de(valor)).toThrow(VersaoIdInvalidoError);
  });
});

describe('Versao', () => {
  it('usa o id como sigla', () => {
    const v = new Versao(
      VersaoId.de('TB'),
      'Tradução Brasileira',
      1917,
      'domínio público',
      '',
      false,
    );
    expect(v.sigla).toBe('TB');
  });
});
