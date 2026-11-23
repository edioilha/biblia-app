import type { VersaoId } from '../../dominio/biblia';
import type { ServicoBusca } from '../portas';

/**
 * Pré-condição do UC03 ("versão ativa indexada"): monta o índice em segundo plano depois
 * que a versão está disponível, para a primeira busca ser rápida (RNF02).
 */
export class PrepararBusca {
  constructor(
    private readonly servico: ServicoBusca,
    private readonly versao: VersaoId,
  ) {}

  executar(): Promise<void> {
    return this.servico.preparar(this.versao);
  }
}
