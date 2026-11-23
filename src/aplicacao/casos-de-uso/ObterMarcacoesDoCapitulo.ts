import type { Referencia, VersaoId } from '../../dominio/biblia';
import { MarcacoesDoCapitulo } from '../../dominio/estudo';
import type { DestaqueRepository, FavoritoRepository } from '../portas';

/**
 * UC01 (passo 3) — marcações a aplicar na página do capítulo. Separado de AbrirCapitulo
 * para que alterar uma marcação recarregue só as marcações, sem reler o texto nem
 * regravar a posição de leitura (docs/06 §5.1). Favoritos valem para qualquer versão;
 * destaques são da versão exibida.
 */
export class ObterMarcacoesDoCapitulo {
  constructor(
    private readonly favoritos: FavoritoRepository,
    private readonly destaques: DestaqueRepository,
  ) {}

  async executar(versao: VersaoId, ref: Referencia): Promise<MarcacoesDoCapitulo> {
    const capitulo = ref.doCapitulo();
    const [favoritos, destaques] = await Promise.all([
      this.favoritos.porCapitulo(capitulo),
      this.destaques.porCapitulo(versao, capitulo),
    ]);
    return new MarcacoesDoCapitulo(capitulo, favoritos, destaques);
  }
}
