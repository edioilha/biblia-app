import type { Referencia } from '../../dominio/biblia';
import { Favorito, FavoritoId } from '../../dominio/estudo';
import type { FavoritoRepository, GeradorId, Relogio } from '../portas';

/**
 * UC04 — Gerenciar favoritos (RF03.1): marca o versículo como favorito ou,
 * se já for, desmarca. Devolve o novo estado (`true` = favoritado).
 */
export class AlternarFavorito {
  constructor(
    private readonly favoritos: FavoritoRepository,
    private readonly relogio: Relogio,
    private readonly gerador: GeradorId,
  ) {}

  async executar(versiculo: Referencia): Promise<boolean> {
    Favorito.exigirVersiculo(versiculo);

    const existente = await this.favoritos.porReferencia(versiculo);
    if (existente) {
      await this.favoritos.remover(existente.id);
      return false;
    }

    const novo = Favorito.criar(
      FavoritoId.de(this.gerador.novo()),
      versiculo,
      this.relogio.agora(),
    );
    await this.favoritos.salvar(novo);
    return true;
  }
}
