import type { FavoritoRepository } from '../../aplicacao/portas';
import { Referencia, type Canon } from '../../dominio/biblia';
import { Favorito, FavoritoId } from '../../dominio/estudo';
import type { BancoApp, FavoritoRegistro } from './BancoApp';

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
    await this.db.favoritos.put({
      id: f.id,
      chave: f.referencia.chave(),
      livro: f.referencia.livro.valor,
      capitulo: f.referencia.capitulo,
      criadoEm: f.criadoEm,
    });
  }

  async remover(id: FavoritoId): Promise<void> {
    await this.db.favoritos.delete(id);
  }

  /** `null` para registro inválido (ex.: gravado por versão antiga ou importado corrompido). */
  private paraDominio(r: FavoritoRegistro): Favorito | null {
    try {
      return Favorito.criar(
        FavoritoId.de(r.id),
        Referencia.deChave(r.chave, this.canon),
        r.criadoEm,
      );
    } catch {
      return null;
    }
  }
}
