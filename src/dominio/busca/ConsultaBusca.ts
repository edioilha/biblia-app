import type { CodigoLivro, Livro, Testamento } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';
import { tokenizar } from './normalizacao';

export class ConsultaBuscaInvalidaError extends ErroDominio {}

/** RF02.3 — como os termos se combinam. */
export type ModoBusca = 'TODAS_PALAVRAS' | 'QUALQUER_PALAVRA' | 'FRASE_EXATA';
const MODOS: readonly ModoBusca[] = ['TODAS_PALAVRAS', 'QUALQUER_PALAVRA', 'FRASE_EXATA'];
export const ModoBusca = {
  todos: MODOS,
  padrao: 'TODAS_PALAVRAS' as ModoBusca,
  de(valor: string): ModoBusca {
    const modo = MODOS.find((m) => m === valor);
    if (!modo) throw new ConsultaBuscaInvalidaError(`Modo de busca inválido: "${valor}".`);
    return modo;
  },
};

/** UC03 — relevância (padrão) ou ordem canônica. */
export type Ordenacao = 'RELEVANCIA' | 'CANONICA';
const ORDENACOES: readonly Ordenacao[] = ['RELEVANCIA', 'CANONICA'];
export const Ordenacao = {
  todas: ORDENACOES,
  padrao: 'RELEVANCIA' as Ordenacao,
  de(valor: string): Ordenacao {
    const o = ORDENACOES.find((x) => x === valor);
    if (!o) throw new ConsultaBuscaInvalidaError(`Ordenação inválida: "${valor}".`);
    return o;
  },
};

/** RF02.7 — tamanhos de página oferecidos (padrão 20). */
export const TAMANHOS_PAGINA = [10, 20, 50] as const;
export const TAMANHO_PAGINA_PADRAO = 20;

/** UC03 — termo mínimo (letras e números, sem contar espaços e pontuação). */
export const TERMO_MINIMO = 2;

/** RF02.5 — testamento e/ou livros. Vazio = toda a Bíblia. */
export class FiltroBusca {
  static readonly TODA_BIBLIA = new FiltroBusca(null, []);

  private constructor(
    readonly testamento: Testamento | null,
    readonly livros: readonly CodigoLivro[],
  ) {}

  /** Livros fora do testamento escolhido são descartados. */
  static de(testamento: Testamento | null, livros: readonly Livro[] = []): FiltroBusca {
    const codigos = livros
      .filter((l) => testamento === null || l.testamento === testamento)
      .map((l) => l.codigo);
    return new FiltroBusca(testamento, codigos);
  }

  get vazio(): boolean {
    return this.testamento === null && this.livros.length === 0;
  }

  aceita(livro: Livro): boolean {
    if (this.testamento !== null && livro.testamento !== this.testamento) return false;
    return this.livros.length === 0 || this.livros.some((c) => c.equals(livro.codigo));
  }
}

export interface OpcoesConsulta {
  modo?: ModoBusca;
  filtro?: FiltroBusca;
  fuzzy?: boolean;
  ordenacao?: Ordenacao;
  pagina?: number;
  tamanhoPagina?: number;
}

/**
 * Value object de uma busca (UC03). `termos` são as palavras normalizadas (sem acentos e
 * minúsculas, RF02.2). Imutável: `com()` devolve uma cópia alterada.
 */
export class ConsultaBusca {
  private constructor(
    /** O que o leitor digitou, sem as aspas. */
    readonly termo: string,
    readonly termos: readonly string[],
    readonly modo: ModoBusca,
    readonly filtro: FiltroBusca,
    readonly fuzzy: boolean,
    readonly ordenacao: Ordenacao,
    readonly pagina: number,
    readonly tamanhoPagina: number,
  ) {}

  /**
   * Interpreta a entrada do leitor. Termo entre aspas → frase exata (A1), qualquer que seja
   * o modo pedido.
   */
  static interpretar(entrada: string, opcoes: OpcoesConsulta = {}): ConsultaBusca {
    const limpa = entrada.trim();
    const entreAspas = /^["“”].*["“”]$/su.test(limpa) && limpa.length >= 2;
    const termo = entreAspas ? limpa.slice(1, -1).trim() : limpa;
    const pagina = opcoes.pagina ?? 1;
    const tamanhoPagina = opcoes.tamanhoPagina ?? TAMANHO_PAGINA_PADRAO;
    if (!Number.isInteger(pagina) || pagina < 1) {
      throw new ConsultaBuscaInvalidaError(`Página inválida: ${pagina}.`);
    }
    if (!Number.isInteger(tamanhoPagina) || tamanhoPagina < 1 || tamanhoPagina > 100) {
      throw new ConsultaBuscaInvalidaError(`Tamanho de página inválido: ${tamanhoPagina}.`);
    }
    return new ConsultaBusca(
      termo,
      tokenizar(termo).map((t) => t.termo),
      entreAspas ? 'FRASE_EXATA' : (opcoes.modo ?? ModoBusca.padrao),
      opcoes.filtro ?? FiltroBusca.TODA_BIBLIA,
      opcoes.fuzzy ?? false,
      opcoes.ordenacao ?? Ordenacao.padrao,
      pagina,
      tamanhoPagina,
    );
  }

  /** Atende ao termo mínimo (UC03, regras). */
  get pesquisavel(): boolean {
    return this.termos.join('').length >= TERMO_MINIMO;
  }

  com(opcoes: OpcoesConsulta): ConsultaBusca {
    return new ConsultaBusca(
      this.termo,
      this.termos,
      opcoes.modo ?? this.modo,
      opcoes.filtro ?? this.filtro,
      opcoes.fuzzy ?? this.fuzzy,
      opcoes.ordenacao ?? this.ordenacao,
      opcoes.pagina ?? this.pagina,
      opcoes.tamanhoPagina ?? this.tamanhoPagina,
    );
  }
}
