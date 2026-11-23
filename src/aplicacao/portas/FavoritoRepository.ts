import type { Referencia } from '../../dominio/biblia';
import type { Favorito, FavoritoId } from '../../dominio/estudo';

export interface FavoritoRepository {
  /** Favoritos dos versículos do capítulo de `capitulo`. */
  porCapitulo(capitulo: Referencia): Promise<Favorito[]>;
  /** Favorito do versículo, ou `null`. */
  porReferencia(versiculo: Referencia): Promise<Favorito | null>;
  /** Todos os favoritos (Meus Estudos, UC13). */
  todos(): Promise<Favorito[]>;
  salvar(favorito: Favorito): Promise<void>;
  remover(id: FavoritoId): Promise<void>;
}
