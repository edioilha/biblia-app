import type { DestaqueId } from '../../dominio/estudo';
import type { DestaqueRepository } from '../portas';

/** UC05 A2 — Remover um destaque inteiro (RF04.4). */
export class RemoverDestaque {
  constructor(private readonly destaques: DestaqueRepository) {}

  async executar(id: DestaqueId): Promise<void> {
    await this.destaques.aplicar({ salvar: [], remover: [id] });
  }
}
