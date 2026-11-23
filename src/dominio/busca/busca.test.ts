import { describe, expect, it } from 'vitest';
import { Canon, CodigoLivro, Testamento } from '../biblia';
import {
  ConsultaBusca,
  ConsultaBuscaInvalidaError,
  FiltroBusca,
  ModoBusca,
  normalizarTermo,
  ocorrenciasDaFrase,
  ocorrenciasDosTermos,
  Pagina,
  tokenizar,
} from '.';

const canon = new Canon();
const livro = (c: string) => canon.livro(CodigoLivro.de(c));
const trechos = (texto: string, o: readonly { de: number; ate: number }[]) =>
  o.map((x) => texto.slice(x.de, x.ate));

describe('normalização (RF02.2)', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalizarTermo('Coração')).toBe('coracao');
    expect(normalizarTermo('ÉDEN')).toBe('eden');
    expect(normalizarTermo('córação'.normalize('NFD'))).toBe('coracao');
  });

  it('tokeniza com posições no texto original; hífen e pontuação separam', () => {
    const texto = 'E disse-lhe: “Amém, Senhor!”';
    expect(tokenizar(texto).map((t) => [t.termo, texto.slice(t.de, t.ate)])).toEqual([
      ['e', 'E'],
      ['disse', 'disse'],
      ['lhe', 'lhe'],
      ['amem', 'Amém'],
      ['senhor', 'Senhor'],
    ]);
  });
});

describe('ConsultaBusca.interpretar', () => {
  it('sem aspas usa o modo pedido (padrão: todas as palavras)', () => {
    const c = ConsultaBusca.interpretar('  Amor de DEUS ');
    expect(c.termo).toBe('Amor de DEUS');
    expect(c.termos).toEqual(['amor', 'de', 'deus']);
    expect(c.modo).toBe('TODAS_PALAVRAS');
    expect(c.pagina).toBe(1);
    expect(c.tamanhoPagina).toBe(20);
    expect(ConsultaBusca.interpretar('amor', { modo: 'QUALQUER_PALAVRA' }).modo).toBe(
      'QUALQUER_PALAVRA',
    );
  });

  it('entre aspas (retas ou curvas) é frase exata (A1)', () => {
    for (const entrada of ['"amor de Deus"', '“amor de Deus”']) {
      const c = ConsultaBusca.interpretar(entrada, { modo: 'QUALQUER_PALAVRA' });
      expect(c.modo).toBe('FRASE_EXATA');
      expect(c.termo).toBe('amor de Deus');
    }
  });

  it('exige ao menos 2 letras ou números', () => {
    expect(ConsultaBusca.interpretar('a').pesquisavel).toBe(false);
    expect(ConsultaBusca.interpretar('" , "').pesquisavel).toBe(false);
    expect(ConsultaBusca.interpretar('é a').pesquisavel).toBe(true);
    expect(ConsultaBusca.interpretar('fé').pesquisavel).toBe(true);
  });

  it('valida página e tamanho; com() altera sem mudar o termo', () => {
    expect(() => ConsultaBusca.interpretar('x', { pagina: 0 })).toThrow(ConsultaBuscaInvalidaError);
    expect(() => ConsultaBusca.interpretar('x', { tamanhoPagina: 0 })).toThrow(
      ConsultaBuscaInvalidaError,
    );
    const c = ConsultaBusca.interpretar('luz').com({ pagina: 3, fuzzy: true });
    expect([c.termo, c.pagina, c.fuzzy, c.modo]).toEqual(['luz', 3, true, 'TODAS_PALAVRAS']);
    expect(() => ModoBusca.de('X')).toThrow(ConsultaBuscaInvalidaError);
  });
});

describe('FiltroBusca (RF02.5)', () => {
  it('testamento e livros; livros fora do testamento são descartados', () => {
    expect(FiltroBusca.TODA_BIBLIA.vazio).toBe(true);
    expect(FiltroBusca.TODA_BIBLIA.aceita(livro('GEN'))).toBe(true);

    const nt = FiltroBusca.de(Testamento.NOVO);
    expect(nt.aceita(livro('JHN'))).toBe(true);
    expect(nt.aceita(livro('GEN'))).toBe(false);

    const alguns = FiltroBusca.de(null, [livro('JHN'), livro('PSA')]);
    expect(alguns.aceita(livro('PSA'))).toBe(true);
    expect(alguns.aceita(livro('ROM'))).toBe(false);

    const misto = FiltroBusca.de(Testamento.NOVO, [livro('JHN'), livro('PSA')]);
    expect(misto.livros.map((c) => c.valor)).toEqual(['JHN']);
  });
});

describe('ocorrências (RF02.8)', () => {
  const texto = 'Porque Deus amou ao mundo; Deus é amor, e o amor de Deus.';

  it('destaca as palavras cujo termo normalizado foi casado', () => {
    expect(trechos(texto, ocorrenciasDosTermos(texto, ['deus', 'amou']))).toEqual([
      'Deus',
      'amou',
      'Deus',
      'Deus',
    ]);
  });

  it('frase exata: só as sequências consecutivas, ignorando pontuação', () => {
    expect(trechos(texto, ocorrenciasDaFrase(texto, ['amor', 'de', 'deus']))).toEqual([
      'amor de Deus',
    ]);
    expect(trechos(texto, ocorrenciasDaFrase(texto, ['mundo', 'deus']))).toEqual(['mundo; Deus']);
    expect(ocorrenciasDaFrase(texto, ['deus', 'amor'])).toEqual([]);
    expect(ocorrenciasDaFrase(texto, [])).toEqual([]);
  });
});

describe('Pagina', () => {
  it('recorta e calcula a navegação', () => {
    const p = Pagina.de([1, 2, 3, 4, 5], 2, 2);
    expect(p.itens).toEqual([3, 4]);
    expect([p.total, p.totalPaginas(), p.temAnterior(), p.temProxima()]).toEqual([
      5,
      3,
      true,
      true,
    ]);
    expect(Pagina.de([1, 2, 3, 4, 5], 3, 2).temProxima()).toBe(false);
    expect(Pagina.vazia(20).totalPaginas()).toBe(1);
  });
});
