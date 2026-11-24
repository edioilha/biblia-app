import type { PlanoId, PlanoLeitura } from '../../dominio/planos';

/** Planos de leitura pré-definidos (RF06.1): dados estáticos do app. */
export interface CatalogoPlanos {
  todos(): Promise<PlanoLeitura[]>;
  /** `null` se o plano não existe (ex.: removido numa versão nova do app). */
  porId(id: PlanoId): Promise<PlanoLeitura | null>;
}
