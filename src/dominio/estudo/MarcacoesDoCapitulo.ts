import type { Referencia } from '../biblia';
import type { CorDestaque } from './CorDestaque';
import type { Destaque, DestaqueId } from './Destaque';
import type { Faixa } from './IntervaloTexto';
import type { Favorito } from './Favorito';

/** Trecho de um versículo coberto por um destaque. */
export interface FaixaDestacada extends Faixa {
  readonly cor: CorDestaque;
  readonly destaque: DestaqueId;
}

/**
 * Read model com as marcações de um capítulo, montado para a renderização da página
 * (não é persistido). Anotações entram em 7.4.
 */
export class MarcacoesDoCapitulo {
  private readonly favoritados: ReadonlySet<number>;
  readonly destaques: readonly Destaque[];

  /** `capitulo` é a referência do capítulo (sem versículo). */
  constructor(
    readonly capitulo: Referencia,
    readonly favoritos: readonly Favorito[],
    destaques: readonly Destaque[] = [],
  ) {
    const doCapitulo = (r: Referencia) => r.doCapitulo().equals(capitulo.doCapitulo());
    this.favoritados = new Set(
      favoritos.filter((f) => doCapitulo(f.referencia)).map((f) => f.referencia.versiculo ?? 0),
    );
    this.destaques = destaques
      .filter((d) => doCapitulo(d.capitulo))
      .sort((a, b) => a.intervalo.inicio.compararCom(b.intervalo.inicio));
  }

  static vazias(capitulo: Referencia): MarcacoesDoCapitulo {
    return new MarcacoesDoCapitulo(capitulo, []);
  }

  favoritado(versiculo: number): boolean {
    return this.favoritados.has(versiculo);
  }

  /** Trechos destacados do versículo (texto com `tamanho` caracteres), em ordem. */
  faixasDestacadas(versiculo: number, tamanho: number): FaixaDestacada[] {
    return this.destaques.flatMap((d) => {
      const faixa = d.intervalo.trechoNoVersiculo(versiculo, tamanho);
      return faixa ? [{ ...faixa, cor: d.cor, destaque: d.id }] : [];
    });
  }

  destaque(id: DestaqueId): Destaque | undefined {
    return this.destaques.find((d) => d.id === id);
  }
}
