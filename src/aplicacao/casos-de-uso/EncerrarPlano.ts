import type { InscricaoId } from '../../dominio/planos';
import type { InscricaoRepository } from '../portas';

/** Deixa de seguir o plano (apaga a inscrição e o progresso). A confirmação é da UI. */
export class EncerrarPlano {
  constructor(private readonly inscricoes: InscricaoRepository) {}

  async executar(id: InscricaoId): Promise<void> {
    await this.inscricoes.remover(id);
  }
}
