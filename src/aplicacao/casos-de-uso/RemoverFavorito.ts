import type { FavoritoId } from '../../dominio/estudo';
import type { FavoritoRepository } from '../portas';

/** UC13 A4 — remover um favorito pela lista de Meus Estudos (RF03.2). A confirmação é da UI. */
export class RemoverFavorito {
  constructor(private readonly favoritos: FavoritoRepository) {}

  async executar(id: FavoritoId): Promise<void> {
    await this.favoritos.remover(id);
  }
}
