import type { AnotacaoRepository } from '../../aplicacao/portas';
import type { Canon, Referencia } from '../../dominio/biblia';
import type { Anotacao, AnotacaoId } from '../../dominio/estudo';
import type { AnotacaoRegistro, BancoApp } from './BancoApp';
import { anotacaoDeRegistro, anotacaoParaRegistro, ouNulo } from './mapeadores';

export class DexieAnotacaoRepository implements AnotacaoRepository {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  async porCapitulo(capitulo: Referencia): Promise<Anotacao[]> {
    const registros = await this.db.anotacoes
      .where('[livro+capitulo]')
      .equals([capitulo.livro.valor, capitulo.capitulo])
      .toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async todas(): Promise<Anotacao[]> {
    const registros = await this.db.anotacoes.toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async porId(id: AnotacaoId): Promise<Anotacao | null> {
    const registro = await this.db.anotacoes.get(id);
    return registro ? this.paraDominio(registro) : null;
  }

  async salvar(a: Anotacao): Promise<void> {
    await this.db.anotacoes.put(anotacaoParaRegistro(a));
  }

  async remover(id: AnotacaoId): Promise<void> {
    await this.db.anotacoes.delete(id);
  }

  private paraDominio(r: AnotacaoRegistro): Anotacao | null {
    return ouNulo(() => anotacaoDeRegistro(r, this.canon));
  }
}
