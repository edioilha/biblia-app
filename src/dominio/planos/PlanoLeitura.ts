import type { CodigoLivro, Referencia } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';

export class PlanoInvalidoError extends ErroDominio {}

/** Identificador estável de um plano pré-definido (ex.: "biblia-1-ano"). */
export type PlanoId = string & { readonly __marca: 'PlanoId' };

export const PlanoId = {
  de(valor: string): PlanoId {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(valor)) {
      throw new PlanoInvalidoError(`Identificador de plano inválido: "${valor}".`);
    }
    return valor as PlanoId;
  },
};

/** Capítulos seguidos de um livro, para exibir a leitura ("Juízes 4–6"). */
export interface SequenciaCapitulos {
  readonly livro: CodigoLivro;
  readonly de: number;
  readonly ate: number;
}

/** Leitura de um dia do plano: capítulos inteiros, na ordem de leitura. */
export class DiaPlano {
  private constructor(
    readonly numero: number,
    readonly capitulos: readonly Referencia[],
  ) {}

  static criar(numero: number, capitulos: readonly Referencia[]): DiaPlano {
    if (capitulos.length === 0) {
      throw new PlanoInvalidoError(`O dia ${numero} do plano não tem leitura.`);
    }
    return new DiaPlano(
      numero,
      capitulos.map((c) => c.doCapitulo()),
    );
  }

  contem(ref: Referencia): boolean {
    const capitulo = ref.doCapitulo();
    return this.capitulos.some((c) => c.equals(capitulo));
  }

  /** Agrupa capítulos seguidos do mesmo livro: [Sl 1, Sl 2, Pv 1] → Sl 1–2; Pv 1. */
  sequencias(): SequenciaCapitulos[] {
    const saida: SequenciaCapitulos[] = [];
    for (const c of this.capitulos) {
      const ultima = saida.at(-1);
      if (ultima?.livro.equals(c.livro) && ultima.ate + 1 === c.capitulo) {
        saida[saida.length - 1] = { ...ultima, ate: c.capitulo };
      } else {
        saida.push({ livro: c.livro, de: c.capitulo, ate: c.capitulo });
      }
    }
    return saida;
  }
}

/**
 * Plano de leitura pré-definido (aggregate root, RF06.1): a leitura de cada dia, do dia 1
 * ao último. Imutável; os planos são dados estáticos do app.
 */
export class PlanoLeitura {
  private constructor(
    readonly id: PlanoId,
    readonly nome: string,
    readonly descricao: string,
    readonly dias: readonly DiaPlano[],
  ) {}

  static criar(
    id: PlanoId,
    nome: string,
    descricao: string,
    leituras: readonly (readonly Referencia[])[],
  ): PlanoLeitura {
    if (leituras.length === 0) throw new PlanoInvalidoError(`O plano "${nome}" não tem dias.`);
    return new PlanoLeitura(
      id,
      nome,
      descricao,
      leituras.map((capitulos, i) => DiaPlano.criar(i + 1, capitulos)),
    );
  }

  get duracaoDias(): number {
    return this.dias.length;
  }

  get totalCapitulos(): number {
    return this.dias.reduce((soma, d) => soma + d.capitulos.length, 0);
  }

  /** Média arredondada, para o catálogo ("~3 capítulos por dia"). */
  get capitulosPorDia(): number {
    return Math.round(this.totalCapitulos / this.duracaoDias);
  }

  dia(numero: number): DiaPlano {
    const dia = this.dias[numero - 1];
    if (!dia) throw new PlanoInvalidoError(`O plano "${this.nome}" não tem o dia ${numero}.`);
    return dia;
  }
}
