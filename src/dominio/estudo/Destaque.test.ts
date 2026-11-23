import { describe, expect, it } from 'vitest';
import { destaque, intervalo, notacao } from '../../test/destaques';
import { CorDestaque, CorDestaqueInvalidaError } from './CorDestaque';
import { DestaqueId, DestaqueIdInvalidoError, DestaqueInvalidoError } from './Destaque';

describe('CorDestaque', () => {
  it('tem amarelo como padrão e valida valores gravados', () => {
    expect(CorDestaque.padrao).toBe('AMARELO');
    expect(CorDestaque.todas).toEqual(['AMARELO', 'VERDE', 'ROSA', 'AZUL']);
    expect(CorDestaque.de('ROSA')).toBe('ROSA');
    expect(() => CorDestaque.de('roxo')).toThrow(CorDestaqueInvalidaError);
  });
});

describe('DestaqueId', () => {
  it('valida UUID', () => {
    expect(() => DestaqueId.de('x')).toThrow(DestaqueIdInvalidoError);
  });
});

describe('Destaque', () => {
  it('guarda versão, intervalo, cor e data; o capítulo vem do intervalo', () => {
    const d = destaque(1, '1:4-2:3', 'VERDE');
    expect(d.versaoId).toBe('BLIVRE');
    expect(notacao(d.intervalo)).toBe('1:4-2:3');
    expect(d.cor).toBe('VERDE');
    expect(d.capitulo.chave()).toBe('JHN.3');
  });

  it('rejeita data inválida', () => {
    expect(() => destaque(1, '1:0-1:3', 'AMARELO', new Date('x'))).toThrow(DestaqueInvalidoError);
  });

  it('muda cor e intervalo devolvendo um novo valor com o mesmo id', () => {
    const d = destaque(1, '1:0-1:3');
    const azul = d.comCor('AZUL');
    expect(azul).not.toBe(d);
    expect([azul.id, azul.cor, d.cor]).toEqual([d.id, 'AZUL', 'AMARELO']);
    expect(d.comCor('AMARELO')).toBe(d);
    expect(notacao(d.comIntervalo(intervalo('2:0-2:3')).intervalo)).toBe('2:0-2:3');
  });

  it('funde ficando com o id e a data do mais antigo', () => {
    const antigo = destaque(1, '1:4-1:7');
    const novo = destaque(2, '1:6-2:3');
    for (const fundido of [novo.fundirCom(antigo), antigo.fundirCom(novo)]) {
      expect(fundido.id).toBe(antigo.id);
      expect(fundido.criadoEm).toEqual(antigo.criadoEm);
      expect(notacao(fundido.intervalo)).toBe('1:4-2:3');
    }
  });

  it('só funde destaques da mesma cor', () => {
    expect(() => destaque(1, '1:0-1:3').fundirCom(destaque(2, '1:2-1:7', 'ROSA'))).toThrow(
      DestaqueInvalidoError,
    );
  });
});
