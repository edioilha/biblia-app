import type { Referencia } from '../biblia';
import type { Ocorrencia } from './ocorrencias';

/** Um versículo encontrado (RF02.8): texto e trechos a destacar. */
export interface ResultadoBusca {
  readonly referencia: Referencia;
  readonly texto: string;
  readonly ocorrencias: readonly Ocorrencia[];
  readonly pontuacao: number;
}

/** RF02.7 — uma página de resultados e o total (em versículos). */
export class Pagina<T> {
  constructor(
    readonly itens: readonly T[],
    readonly pagina: number,
    readonly tamanhoPagina: number,
    readonly total: number,
  ) {}

  static vazia<T>(tamanhoPagina: number): Pagina<T> {
    return new Pagina<T>([], 1, tamanhoPagina, 0);
  }

  /** Recorta a página `pagina` (1-based) de uma lista completa. */
  static de<T>(todos: readonly T[], pagina: number, tamanhoPagina: number): Pagina<T> {
    const inicio = (pagina - 1) * tamanhoPagina;
    return new Pagina(
      todos.slice(inicio, inicio + tamanhoPagina),
      pagina,
      tamanhoPagina,
      todos.length,
    );
  }

  totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.tamanhoPagina));
  }

  temAnterior(): boolean {
    return this.pagina > 1;
  }

  temProxima(): boolean {
    return this.pagina < this.totalPaginas();
  }
}
