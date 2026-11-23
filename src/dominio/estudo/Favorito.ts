import type { Referencia } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';

/** Identificador de um favorito: UUID (v7, gerado no cliente — docs/04 §1). */
export type FavoritoId = string & { readonly __marca: 'FavoritoId' };

export class FavoritoIdInvalidoError extends ErroDominio {
  constructor(valor: string) {
    super(`Identificador de favorito inválido: "${valor}".`);
  }
}

export class FavoritoInvalidoError extends ErroDominio {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export const FavoritoId = {
  de(valor: string): FavoritoId {
    const id = valor.trim().toLowerCase();
    if (!UUID.test(id)) throw new FavoritoIdInvalidoError(valor);
    return id as FavoritoId;
  },
};

/**
 * Versículo marcado como favorito (aggregate root, RF03.1). Independente de versão.
 * Imutável. A unicidade (no máximo um favorito por versículo) é garantida pelo caso de
 * uso AlternarFavorito e por índice único na persistência.
 */
export class Favorito {
  private constructor(
    readonly id: FavoritoId,
    readonly referencia: Referencia,
    readonly criadoEm: Date,
  ) {}

  /** Cria um favorito novo ou reconstitui um persistido. */
  static criar(id: FavoritoId, referencia: Referencia, criadoEm: Date): Favorito {
    Favorito.exigirVersiculo(referencia);
    if (Number.isNaN(criadoEm.getTime())) {
      throw new FavoritoInvalidoError('Data de criação do favorito inválida.');
    }
    return new Favorito(id, referencia, new Date(criadoEm));
  }

  /** Favoritos são sempre de um versículo, nunca de um capítulo inteiro. */
  static exigirVersiculo(referencia: Referencia): void {
    if (referencia.versiculo === null) {
      throw new FavoritoInvalidoError(
        `Favorito exige um versículo; "${referencia.chave()}" é um capítulo.`,
      );
    }
  }
}
