import type { DestaqueRepository } from '../../aplicacao/portas';
import type { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import type { AlteracoesDestaques, Destaque, DestaqueId } from '../../dominio/estudo';
import type { BancoApp, DestaqueRegistro } from './BancoApp';
import { destaqueDeRegistro, destaqueParaRegistro, ouNulo } from './mapeadores';

export class DexieDestaqueRepository implements DestaqueRepository {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  async porCapitulo(versao: VersaoId, capitulo: Referencia): Promise<Destaque[]> {
    const registros = await this.db.destaques
      .where('[versaoId+livro+capitulo]')
      .equals([versao, capitulo.livro.valor, capitulo.capitulo])
      .toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async daVersao(versao: VersaoId): Promise<Destaque[]> {
    const registros = await this.db.destaques
      .where('[versaoId+livro+capitulo]')
      // Toda a faixa da versão no índice composto (qualquer livro e capítulo).
      .between([versao, '', -Infinity], [versao, '\uffff', Infinity], true, true)
      .toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async porId(id: DestaqueId): Promise<Destaque | null> {
    const registro = await this.db.destaques.get(id);
    return registro ? this.paraDominio(registro) : null;
  }

  async aplicar({ salvar, remover, religar = [] }: AlteracoesDestaques): Promise<void> {
    await this.db.transaction('rw', this.db.destaques, this.db.anotacoes, async () => {
      await this.db.destaques.bulkDelete([...remover]);
      await this.db.destaques.bulkPut(salvar.map(destaqueParaRegistro));
      for (const { de, para } of religar) {
        await this.db.anotacoes.where('destaqueId').equals(de).modify({ destaqueId: para });
      }
    });
  }

  private paraDominio(r: DestaqueRegistro): Destaque | null {
    return ouNulo(() => destaqueDeRegistro(r, this.canon));
  }
}
