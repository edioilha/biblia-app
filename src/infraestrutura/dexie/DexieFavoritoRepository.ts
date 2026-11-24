import type { FavoritoRepository } from '../../aplicacao/portas';
import type { Canon, Referencia } from '../../dominio/biblia';
import type { Favorito, FavoritoId } from '../../dominio/estudo';
import type { BancoApp, FavoritoRegistro } from './BancoApp';
import { favoritoDeRegistro, favoritoParaRegistro, ouNulo } from './mapeadores';

export class DexieFavoritoRepository implements FavoritoRepository {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  async porCapitulo(capitulo: Referencia): Promise<Favorito[]> {
    const registros = await this.db.favoritos
      .where('[livro+capitulo]')
      .equals([capitulo.livro.valor, capitulo.capitulo])
      .toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async porReferencia(versiculo: Referencia): Promise<Favorito | null> {
    const registro = await this.db.favoritos.get({ chave: versiculo.chave() });
    return registro ? this.paraDominio(registro) : null;
  }

  async todos(): Promise<Favorito[]> {
    const registros = await this.db.favoritos.toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async salvar(f: Favorito): Promise<void> {
    await this.db.favoritos.put(favoritoParaRegistro(f));
  }

  async remover(id: FavoritoId): Promise<void> {
    await this.db.favoritos.delete(id);
  }

  private paraDominio(r: FavoritoRegistro): Favorito | null {
    return ouNulo(() => favoritoDeRegistro(r, this.canon));
  }
}
