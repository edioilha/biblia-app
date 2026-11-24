import { describe, expect, it } from 'vitest';
import { VersaoId } from '../../dominio/biblia';
import { VersoesDisponiveis } from './VersoesDisponiveis';

describe('VersoesDisponiveis (ADR 0007)', () => {
  const catalogo = new VersoesDisponiveis();

  it('tem só as traduções em domínio público, a padrão primeiro', () => {
    expect(catalogo.todas().map((v) => v.id)).toEqual(['BLIVRE', 'TB', 'ALM1911']);
    expect(catalogo.padrao().id).toBe('BLIVRE');
    expect(catalogo.todas().every((v) => v.licenca === 'Domínio público')).toBe(true);
  });

  it('encontra pela sigla', () => {
    expect(catalogo.porId(VersaoId.de('ALM1911'))?.observacao).toBe('ortografia antiga');
    expect(catalogo.porId(VersaoId.de('NVI'))).toBeNull();
  });
});
