import type { Referencia } from '../biblia';
import type { Anotacao } from './Anotacao';
import type { CorDestaque } from './CorDestaque';
import type { Destaque, DestaqueId } from './Destaque';
import type { Faixa } from './IntervaloTexto';
import type { Favorito } from './Favorito';

/** Trecho de um versículo coberto por um destaque. */
export interface FaixaDestacada extends Faixa {
  readonly cor: CorDestaque;
  readonly destaque: DestaqueId;
}

/** Anotação com o ponto da página onde aparece (RF05.3). */
export interface NotaAncorada {
  readonly anotacao: Anotacao;
  /** Versículo do marcador (rodapé) ou após o qual vem o bloco (inline). */
  readonly versiculo: number;
  /** Offset do marcador no texto do versículo; `null` = fim do versículo. */
  readonly offset: number | null;
  /** Número do marcador de rodapé (1, 2…); `null` para notas inline. */
  readonly numero: number | null;
}

/**
 * Read model com as marcações de um capítulo, montado para a renderização da página
 * (não é persistido). `destaques` devem ser da versão exibida; favoritos e anotações valem
 * para qualquer versão.
 */
export class MarcacoesDoCapitulo {
  private readonly favoritados: ReadonlySet<number>;
  readonly destaques: readonly Destaque[];
  /** Todas as notas do capítulo, na ordem da página. */
  readonly notas: readonly NotaAncorada[];

  /** `capitulo` é a referência do capítulo (sem versículo). */
  constructor(
    readonly capitulo: Referencia,
    readonly favoritos: readonly Favorito[],
    destaques: readonly Destaque[] = [],
    anotacoes: readonly Anotacao[] = [],
  ) {
    const doCapitulo = (r: Referencia) => r.doCapitulo().equals(capitulo.doCapitulo());
    this.favoritados = new Set(
      favoritos.filter((f) => doCapitulo(f.referencia)).map((f) => f.referencia.versiculo ?? 0),
    );
    this.destaques = destaques
      .filter((d) => doCapitulo(d.capitulo))
      .sort((a, b) => a.intervalo.inicio.compararCom(b.intervalo.inicio));
    this.notas = this.ancorar(anotacoes.filter((a) => doCapitulo(a.referencia)));
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

  /** Notas de rodapé, numeradas na ordem da página. */
  notasDeRodape(): NotaAncorada[] {
    return this.notas.filter((n) => n.numero !== null);
  }

  /** Marcadores de rodapé no texto do versículo. */
  marcadores(versiculo: number): NotaAncorada[] {
    return this.notas.filter((n) => n.numero !== null && n.versiculo === versiculo);
  }

  /** Notas inline exibidas logo após o versículo. */
  notasInline(versiculo: number): NotaAncorada[] {
    return this.notas.filter((n) => n.numero === null && n.versiculo === versiculo);
  }

  /**
   * Nota de destaque fica no fim do destaque; sem o destaque (removido ou de outra versão),
   * fica no fim do versículo. Ordem: posição na página, depois data de criação.
   */
  private ancorar(anotacoes: readonly Anotacao[]): NotaAncorada[] {
    const posicionadas = anotacoes.map((anotacao) => {
      const destaque = anotacao.destaqueId ? this.destaque(anotacao.destaqueId) : undefined;
      return destaque
        ? {
            anotacao,
            versiculo: destaque.intervalo.fim.numero,
            offset: destaque.intervalo.fim.offset,
          }
        : { anotacao, versiculo: anotacao.referencia.versiculo ?? 0, offset: null };
    });
    posicionadas.sort(
      (a, b) =>
        a.versiculo - b.versiculo ||
        (a.offset ?? Infinity) - (b.offset ?? Infinity) ||
        a.anotacao.criadoEm.getTime() - b.anotacao.criadoEm.getTime() ||
        a.anotacao.id.localeCompare(b.anotacao.id),
    );
    let numero = 0;
    return posicionadas.map((p) => ({
      ...p,
      numero: p.anotacao.exibicao === 'RODAPE' ? ++numero : null,
    }));
  }
}
