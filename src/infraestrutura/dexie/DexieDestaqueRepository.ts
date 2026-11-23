import type { DestaqueRepository } from '../../aplicacao/portas';
import { Referencia, VersaoId, type Canon } from '../../dominio/biblia';
import {
  CorDestaque,
  Destaque,
  DestaqueId,
  IntervaloTexto,
  PosicaoTexto,
  type AlteracoesDestaques,
} from '../../dominio/estudo';
import type { BancoApp, DestaqueRegistro, PosicaoRegistro } from './BancoApp';

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

  async porId(id: DestaqueId): Promise<Destaque | null> {
    const registro = await this.db.destaques.get(id);
    return registro ? this.paraDominio(registro) : null;
  }

  async aplicar({ salvar, remover }: AlteracoesDestaques): Promise<void> {
    await this.db.transaction('rw', this.db.destaques, async () => {
      await this.db.destaques.bulkDelete([...remover]);
      await this.db.destaques.bulkPut(salvar.map((d) => this.paraRegistro(d)));
    });
  }

  private paraRegistro(d: Destaque): DestaqueRegistro {
    const { inicio, fim } = d.intervalo;
    return {
      id: d.id,
      versaoId: d.versaoId,
      livro: d.capitulo.livro.valor,
      capitulo: d.capitulo.capitulo,
      inicio: [inicio.numero, inicio.offset],
      fim: [fim.numero, fim.offset],
      cor: d.cor,
      criadoEm: d.criadoEm,
    };
  }

  /** `null` para registro inválido (ex.: gravado por versão antiga ou importado corrompido). */
  private paraDominio(r: DestaqueRegistro): Destaque | null {
    try {
      const posicao = ([versiculo, offset]: PosicaoRegistro) =>
        PosicaoTexto.em(
          Referencia.deChave(`${r.livro}.${r.capitulo}.${versiculo}`, this.canon),
          offset,
        );
      return Destaque.criar(
        DestaqueId.de(r.id),
        VersaoId.de(r.versaoId),
        IntervaloTexto.criar(posicao(r.inicio), posicao(r.fim)),
        CorDestaque.de(r.cor),
        r.criadoEm,
      );
    } catch {
      return null;
    }
  }
}
