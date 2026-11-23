import type { VersaoId } from '../../dominio/biblia';
import type { ConsultaBusca, Pagina, ResultadoBusca } from '../../dominio/busca';

/** Busca full-text numa versão (ADR 0005: MiniSearch em Web Worker). */
export interface ServicoBusca {
  /** Prepara o índice da versão (idempotente; chamadas concorrentes compartilham o preparo). */
  preparar(versao: VersaoId): Promise<void>;
  /** Prepara o índice se preciso e devolve a página pedida. */
  buscar(versao: VersaoId, consulta: ConsultaBusca): Promise<Pagina<ResultadoBusca>>;
}
