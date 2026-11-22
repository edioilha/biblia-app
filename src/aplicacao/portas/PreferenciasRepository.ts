import type { Preferencias } from '../../dominio/preferencias';

export interface PreferenciasRepository {
  /** `null` na primeira execução. */
  obter(): Promise<Preferencias | null>;
  salvar(preferencias: Preferencias): Promise<void>;
}
