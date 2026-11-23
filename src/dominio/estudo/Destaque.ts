import type { Referencia, VersaoId } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';
import { normalizarUuid } from '../compartilhado/uuid';
import type { CorDestaque } from './CorDestaque';
import type { IntervaloTexto } from './IntervaloTexto';

/** Identificador de um destaque: UUID (v7, gerado no cliente — docs/04 §1). */
export type DestaqueId = string & { readonly __marca: 'DestaqueId' };

export class DestaqueIdInvalidoError extends ErroDominio {
  constructor(valor: string) {
    super(`Identificador de destaque inválido: "${valor}".`);
  }
}

export class DestaqueInvalidoError extends ErroDominio {}

export const DestaqueId = {
  de(valor: string): DestaqueId {
    const id = normalizarUuid(valor);
    if (id === null) throw new DestaqueIdInvalidoError(valor);
    return id as DestaqueId;
  },
};

/**
 * Trecho marcado com marca-texto (aggregate root, RF04). Pertence a uma versão, pois os
 * offsets dependem do texto da tradução. Imutável: as alterações devolvem um novo valor
 * com o mesmo `id`.
 */
export class Destaque {
  private constructor(
    readonly id: DestaqueId,
    readonly versaoId: VersaoId,
    readonly intervalo: IntervaloTexto,
    readonly cor: CorDestaque,
    readonly criadoEm: Date,
  ) {}

  /** Cria um destaque novo ou reconstitui um persistido. */
  static criar(
    id: DestaqueId,
    versaoId: VersaoId,
    intervalo: IntervaloTexto,
    cor: CorDestaque,
    criadoEm: Date,
  ): Destaque {
    if (Number.isNaN(criadoEm.getTime())) {
      throw new DestaqueInvalidoError('Data de criação do destaque inválida.');
    }
    return new Destaque(id, versaoId, intervalo, cor, new Date(criadoEm));
  }

  get capitulo(): Referencia {
    return this.intervalo.capitulo;
  }

  comCor(cor: CorDestaque): Destaque {
    return cor === this.cor ? this : this.com({ cor });
  }

  comIntervalo(intervalo: IntervaloTexto): Destaque {
    return this.com({ intervalo });
  }

  /**
   * UC05 A1 — une dois destaques da mesma cor e versão num só. O resultado fica com o id e
   * a data do mais antigo, para que o que já existia (e o que aponta para ele) permaneça.
   */
  fundirCom(outro: Destaque): Destaque {
    if (outro.cor !== this.cor || outro.versaoId !== this.versaoId) {
      throw new DestaqueInvalidoError('Só se fundem destaques da mesma cor e versão.');
    }
    const base = outro.criadoEm < this.criadoEm ? outro : this;
    return base.comIntervalo(this.intervalo.unir(outro.intervalo));
  }

  private com(mudancas: { cor?: CorDestaque; intervalo?: IntervaloTexto }): Destaque {
    return new Destaque(
      this.id,
      this.versaoId,
      mudancas.intervalo ?? this.intervalo,
      mudancas.cor ?? this.cor,
      this.criadoEm,
    );
  }
}
