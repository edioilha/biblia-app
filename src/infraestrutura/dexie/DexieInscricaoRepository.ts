import type { InscricaoRepository } from '../../aplicacao/portas';
import type { InscricaoId, InscricaoPlano, PlanoId } from '../../dominio/planos';
import type { BancoApp, InscricaoRegistro } from './BancoApp';
import { inscricaoDeRegistro, inscricaoParaRegistro, ouNulo } from './mapeadores';

export class DexieInscricaoRepository implements InscricaoRepository {
  constructor(private readonly db: BancoApp) {}

  async todas(): Promise<InscricaoPlano[]> {
    const registros = await this.db.inscricoes.toArray();
    return registros.flatMap((r) => this.paraDominio(r) ?? []);
  }

  async porId(id: InscricaoId): Promise<InscricaoPlano | null> {
    const registro = await this.db.inscricoes.get(id);
    return registro ? this.paraDominio(registro) : null;
  }

  async porPlano(plano: PlanoId): Promise<InscricaoPlano | null> {
    const registro = await this.db.inscricoes.get({ planoId: plano });
    return registro ? this.paraDominio(registro) : null;
  }

  async salvar(i: InscricaoPlano): Promise<void> {
    await this.db.inscricoes.put(inscricaoParaRegistro(i));
  }

  async remover(id: InscricaoId): Promise<void> {
    await this.db.inscricoes.delete(id);
  }

  private paraDominio(r: InscricaoRegistro): InscricaoPlano | null {
    return ouNulo(() => inscricaoDeRegistro(r));
  }
}
