import type { AnotacaoId } from '../../dominio/estudo';
import type { AnotacaoRepository } from '../portas';

/** UC06 A2 — Excluir anotação (RF05.4). A confirmação é da UI. */
export class ExcluirAnotacao {
  constructor(private readonly anotacoes: AnotacaoRepository) {}

  async executar(id: AnotacaoId): Promise<void> {
    await this.anotacoes.remover(id);
  }
}
