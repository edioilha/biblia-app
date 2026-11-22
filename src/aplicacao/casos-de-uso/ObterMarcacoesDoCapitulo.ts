import type { Referencia } from '../../dominio/biblia';
import { MarcacoesDoCapitulo } from '../../dominio/estudo';
import type { FavoritoRepository } from '../portas';

/**
 * UC01 (passo 3) — marcações a aplicar na página do capítulo. Separado de AbrirCapitulo
 * para que alterar uma marcação recarregue só as marcações, sem reler o texto nem
 * regravar a posição de leitura (docs/06 §5.1).
 */
export class ObterMarcacoesDoCapitulo {
  constructor(private readonly favoritos: FavoritoRepository) {}

  async executar(ref: Referencia): Promise<MarcacoesDoCapitulo> {
    const capitulo = ref.doCapitulo();
    return new MarcacoesDoCapitulo(capitulo, await this.favoritos.porCapitulo(capitulo));
  }
}
