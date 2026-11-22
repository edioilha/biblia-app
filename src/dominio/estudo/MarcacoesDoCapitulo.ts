import type { Referencia } from '../biblia';
import type { Favorito } from './Favorito';

/**
 * Read model com as marcações de um capítulo, montado para a renderização da página
 * (não é persistido). Nesta fase só favoritos; destaques e anotações entram em 7.3/7.4.
 */
export class MarcacoesDoCapitulo {
  private readonly favoritados: ReadonlySet<number>;

  /** `capitulo` é a referência do capítulo (sem versículo). */
  constructor(
    readonly capitulo: Referencia,
    readonly favoritos: readonly Favorito[],
  ) {
    this.favoritados = new Set(
      favoritos
        .filter((f) => f.referencia.doCapitulo().equals(capitulo.doCapitulo()))
        .map((f) => f.referencia.versiculo ?? 0),
    );
  }

  static vazias(capitulo: Referencia): MarcacoesDoCapitulo {
    return new MarcacoesDoCapitulo(capitulo, []);
  }

  favoritado(versiculo: number): boolean {
    return this.favoritados.has(versiculo);
  }
}
