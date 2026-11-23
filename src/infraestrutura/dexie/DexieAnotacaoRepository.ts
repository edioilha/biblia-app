import type { AnotacaoRepository } from '../../aplicacao/portas';
import { Referencia, type Canon } from '../../dominio/biblia';
import { Anotacao, AnotacaoId, DestaqueId, ModoExibicao } from '../../dominio/estudo';
import type { AnotacaoRegistro, BancoApp } from './BancoApp';

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

  async porId(id: AnotacaoId): Promise<Anotacao | null> {
    const registro = await this.db.anotacoes.get(id);
    return registro ? this.paraDominio(registro) : null;
  }

  async salvar(a: Anotacao): Promise<void> {
    await this.db.anotacoes.put({
      id: a.id,
      chave: a.referencia.chave(),
      livro: a.referencia.livro.valor,
      capitulo: a.referencia.capitulo,
      destaqueId: a.destaqueId,
      conteudo: a.conteudo,
      exibicao: a.exibicao,
      criadoEm: a.criadoEm,
      atualizadoEm: a.atualizadoEm,
    });
  }

  async remover(id: AnotacaoId): Promise<void> {
    await this.db.anotacoes.delete(id);
  }

  /** `null` para registro inválido (ex.: gravado por versão antiga ou importado corrompido). */
  private paraDominio(r: AnotacaoRegistro): Anotacao | null {
    try {
      return Anotacao.reconstituir(
        AnotacaoId.de(r.id),
        Referencia.deChave(r.chave, this.canon),
        r.destaqueId === null ? null : DestaqueId.de(r.destaqueId),
        r.conteudo,
        ModoExibicao.de(r.exibicao),
        r.criadoEm,
        r.atualizadoEm,
      );
    } catch {
      return null;
    }
  }
}
