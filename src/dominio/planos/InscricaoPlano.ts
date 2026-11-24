import { ErroDominio } from '../compartilhado/ErroDominio';
import { normalizarUuid } from '../compartilhado/uuid';
import type { DataLocal } from './DataLocal';
import type { PlanoId } from './PlanoLeitura';

/** Identificador de uma inscrição: UUID (v7, gerado no cliente — docs/04 §1). */
export type InscricaoId = string & { readonly __marca: 'InscricaoId' };

export class InscricaoInvalidaError extends ErroDominio {}

export const InscricaoId = {
  de(valor: string): InscricaoId {
    const id = normalizarUuid(valor);
    if (id === null)
      throw new InscricaoInvalidaError(`Identificador de inscrição inválido: "${valor}".`);
    return id as InscricaoId;
  },
};

export type StatusInscricao = 'EM_ANDAMENTO' | 'CONCLUIDO';

/** RF06.4 — dias concluídos sobre o total. */
export interface Progresso {
  readonly concluidos: number;
  readonly total: number;
  /** 0–100, arredondado para baixo (100 só com tudo concluído). */
  readonly percentual: number;
}

/**
 * O leitor seguindo um plano (aggregate root, UC07/UC08). Guarda a data de início, os dias
 * concluídos e o total de dias do plano (cópia, para não depender do catálogo). Imutável:
 * as alterações devolvem uma nova inscrição com o mesmo `id`.
 *
 * O dia N do plano cai na data `inicio + (N − 1)`. Dias concluídos podem estar em qualquer
 * ordem (UC08 A1).
 */
export class InscricaoPlano {
  private constructor(
    readonly id: InscricaoId,
    readonly planoId: PlanoId,
    readonly totalDias: number,
    readonly inicio: DataLocal,
    readonly diasConcluidos: ReadonlySet<number>,
  ) {}

  /** Inicia (UC07) ou reconstitui uma inscrição persistida. */
  static criar(
    id: InscricaoId,
    planoId: PlanoId,
    totalDias: number,
    inicio: DataLocal,
    diasConcluidos: Iterable<number> = [],
  ): InscricaoPlano {
    if (!Number.isInteger(totalDias) || totalDias < 1) {
      throw new InscricaoInvalidaError(`Total de dias inválido: ${totalDias}.`);
    }
    const dias = new Set(diasConcluidos);
    for (const n of dias) InscricaoPlano.exigirDia(n, totalDias);
    return new InscricaoPlano(id, planoId, totalDias, inicio, dias);
  }

  private static exigirDia(numero: number, total: number): void {
    if (!Number.isInteger(numero) || numero < 1 || numero > total) {
      throw new InscricaoInvalidaError(`Dia ${numero} fora do plano (1–${total}).`);
    }
  }

  get status(): StatusInscricao {
    return this.diasConcluidos.size === this.totalDias ? 'CONCLUIDO' : 'EM_ANDAMENTO';
  }

  /**
   * Dia do plano que cai em `hoje`, limitado ao último dia; `null` se o plano ainda não
   * começou (início no futuro).
   */
  diaDe(hoje: DataLocal): number | null {
    const n = this.inicio.diasAte(hoje) + 1;
    if (n < 1) return null;
    return Math.min(n, this.totalDias);
  }

  /** Data em que cai o dia `numero`. */
  dataDoDia(numero: number): DataLocal {
    InscricaoPlano.exigirDia(numero, this.totalDias);
    return this.inicio.somarDias(numero - 1);
  }

  concluido(numero: number): boolean {
    return this.diasConcluidos.has(numero);
  }

  /**
   * RF06.4 / UC08 A1 — dias anteriores a hoje ainda não concluídos, em ordem. Depois do fim
   * do plano, todos os pendentes estão em atraso.
   */
  diasAtrasados(hoje: DataLocal): number[] {
    const n = this.inicio.diasAte(hoje) + 1;
    const ultimoVencido = Math.min(n - 1, this.totalDias);
    const atrasados: number[] = [];
    for (let d = 1; d <= ultimoVencido; d++) if (!this.concluido(d)) atrasados.push(d);
    return atrasados;
  }

  /** Primeiro dia ainda não concluído, ou `null` se o plano acabou. */
  primeiroPendente(): number | null {
    for (let d = 1; d <= this.totalDias; d++) if (!this.concluido(d)) return d;
    return null;
  }

  progresso(): Progresso {
    const concluidos = this.diasConcluidos.size;
    return {
      concluidos,
      total: this.totalDias,
      percentual: Math.floor((concluidos * 100) / this.totalDias),
    };
  }

  /** UC08 passo 5 / A1 — conclui um dia (qualquer um, em qualquer ordem). */
  concluirDia(numero: number): InscricaoPlano {
    InscricaoPlano.exigirDia(numero, this.totalDias);
    if (this.concluido(numero)) return this;
    return this.com({ dias: new Set([...this.diasConcluidos, numero]) });
  }

  /** Desfaz a conclusão de um dia (toque por engano). */
  desfazerDia(numero: number): InscricaoPlano {
    InscricaoPlano.exigirDia(numero, this.totalDias);
    if (!this.concluido(numero)) return this;
    const dias = new Set(this.diasConcluidos);
    dias.delete(numero);
    return this.com({ dias });
  }

  /**
   * UC08 A2 / RF06.5 — reagenda para que o primeiro dia pendente caia em `hoje`. Os dias
   * concluídos continuam concluídos. Sem atraso, nada muda.
   */
  reagendar(hoje: DataLocal): InscricaoPlano {
    const pendente = this.primeiroPendente();
    if (pendente === null || this.diasAtrasados(hoje).length === 0) return this;
    return this.com({ inicio: hoje.somarDias(-(pendente - 1)) });
  }

  private com(m: { inicio?: DataLocal; dias?: ReadonlySet<number> }): InscricaoPlano {
    return new InscricaoPlano(
      this.id,
      this.planoId,
      this.totalDias,
      m.inicio ?? this.inicio,
      m.dias ?? this.diasConcluidos,
    );
  }
}
