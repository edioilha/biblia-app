import { describe, expect, it } from 'vitest';
import {
  ConfiguracaoLeitura,
  ConfiguracaoLeituraInvalidaError,
  FamiliaFonte,
  LarguraPagina,
  TAMANHO_MAXIMO,
  TAMANHO_MINIMO,
  Tema,
  TipoFolha,
} from './ConfiguracaoLeitura';

describe('ConfiguracaoLeitura (UC12)', () => {
  it('padrão: tema claro, tamanho 3, página estreita, fonte clássica, folha com textura', () => {
    const { tema, tamanhoFonte, largura, fonte, folha } = ConfiguracaoLeitura.padrao;
    expect([tema, tamanhoFonte, largura, fonte, folha]).toEqual([
      'CLARO',
      3,
      'ESTREITA',
      'CLASSICA',
      'TEXTURA',
    ]);
    expect(ConfiguracaoLeitura.criar('CLARO', 3)).toEqual(ConfiguracaoLeitura.padrao);
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

  describe('largura da página (BL-01)', () => {
    it('troca a largura mantendo tema e tamanho', () => {
      const c = ConfiguracaoLeitura.criar('SEPIA', 5).comLargura('LARGA');
      expect([c.tema, c.tamanhoFonte, c.largura]).toEqual(['SEPIA', 5, 'LARGA']);
      expect(c.comLargura('LARGA')).toBe(c);
      expect(c.equals(ConfiguracaoLeitura.criar('SEPIA', 5))).toBe(false);
    });

    it('tema e tamanho não mexem na largura', () => {
      const c = ConfiguracaoLeitura.criar('CLARO', 3, 'MEDIA');
      expect(c.aumentar().largura).toBe('MEDIA');
      expect(c.diminuir().largura).toBe('MEDIA');
      expect(c.comTema('ESCURO').largura).toBe('MEDIA');
    });

    it('valida a largura', () => {
      expect(LarguraPagina.todas).toEqual(['ESTREITA', 'MEDIA', 'LARGA']);
      expect(LarguraPagina.de('MEDIA')).toBe('MEDIA');
      expect(() => LarguraPagina.de('GIGANTE')).toThrow(ConfiguracaoLeituraInvalidaError);
    });
  });

  describe('fonte (BL-02) e folha (BL-03)', () => {
    it('trocam só o próprio campo', () => {
      const c = ConfiguracaoLeitura.criar('ESCURO', 5, 'MEDIA');
      const f = c.comFonte('LEGIVEL').comFolha('PAUTADO');
      expect([f.tema, f.tamanhoFonte, f.largura, f.fonte, f.folha]).toEqual([
        'ESCURO',
        5,
        'MEDIA',
        'LEGIVEL',
        'PAUTADO',
      ]);
      expect(f.comFonte('LEGIVEL')).toBe(f);
      expect(f.comFolha('PAUTADO')).toBe(f);
      expect(f.equals(c)).toBe(false);
      expect(c.comFonte('MODERNA').equals(c.comFolha('LISO'))).toBe(false);
    });

    it('tamanho, tema e largura não mexem na fonte nem na folha', () => {
      const c = ConfiguracaoLeitura.criar('CLARO', 3, 'ESTREITA', 'SEM_SERIFA', 'ENVELHECIDO');
      for (const outra of [c.aumentar(), c.diminuir(), c.comTema('SEPIA'), c.comLargura('LARGA')]) {
        expect([outra.fonte, outra.folha]).toEqual(['SEM_SERIFA', 'ENVELHECIDO']);
      }
    });

    it('validam o valor', () => {
      expect(FamiliaFonte.todas).toEqual(['CLASSICA', 'MODERNA', 'SEM_SERIFA', 'LEGIVEL']);
      expect(FamiliaFonte.de('MODERNA')).toBe('MODERNA');
      expect(() => FamiliaFonte.de('COMIC')).toThrow(ConfiguracaoLeituraInvalidaError);
      expect(TipoFolha.todas).toEqual(['LISO', 'TEXTURA', 'ENVELHECIDO', 'PAUTADO']);
      expect(TipoFolha.de('LISO')).toBe('LISO');
      expect(() => TipoFolha.de('PAPIRO')).toThrow(ConfiguracaoLeituraInvalidaError);
    });
  });
});
