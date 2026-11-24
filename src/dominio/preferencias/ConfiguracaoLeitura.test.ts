import { describe, expect, it } from 'vitest';
import {
  ConfiguracaoLeitura,
  ConfiguracaoLeituraInvalidaError,
  TAMANHO_MAXIMO,
  TAMANHO_MINIMO,
  Tema,
} from './ConfiguracaoLeitura';

describe('ConfiguracaoLeitura (UC12)', () => {
  it('padrão: tema claro, tamanho 3', () => {
    expect(ConfiguracaoLeitura.padrao.tema).toBe('CLARO');
    expect(ConfiguracaoLeitura.padrao.tamanhoFonte).toBe(3);
  });

  it('A+ e A− respeitam os limites e não alteram a original', () => {
    const c = ConfiguracaoLeitura.padrao;
    expect(c.aumentar().tamanhoFonte).toBe(4);
    expect(c.diminuir().tamanhoFonte).toBe(2);
    expect(c.tamanhoFonte).toBe(3);

    const maior = ConfiguracaoLeitura.criar('CLARO', TAMANHO_MAXIMO);
    expect(maior.podeAumentar).toBe(false);
    expect(maior.aumentar()).toBe(maior);
    const menor = ConfiguracaoLeitura.criar('CLARO', TAMANHO_MINIMO);
    expect(menor.podeDiminuir).toBe(false);
    expect(menor.diminuir()).toBe(menor);
  });

  it('troca o tema mantendo o tamanho', () => {
    const c = ConfiguracaoLeitura.criar('CLARO', 5).comTema('ESCURO');
    expect([c.tema, c.tamanhoFonte]).toEqual(['ESCURO', 5]);
    expect(c.comTema('ESCURO')).toBe(c);
  });

  it.each([0, 8, 2.5])('rejeita tamanho %j', (n) => {
    expect(() => ConfiguracaoLeitura.criar('CLARO', n)).toThrow(ConfiguracaoLeituraInvalidaError);
  });

  it('valida o tema', () => {
    expect(Tema.de('SEPIA')).toBe('SEPIA');
    expect(() => Tema.de('AZUL')).toThrow(ConfiguracaoLeituraInvalidaError);
  });
});
