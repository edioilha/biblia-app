import type { InscricaoRepository } from '../../aplicacao/portas';
import { DataLocal, InscricaoId, InscricaoPlano, PlanoId } from '../../dominio/planos';
import type { BancoApp, InscricaoRegistro } from './BancoApp';

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
    await this.db.inscricoes.put({
      id: i.id,
      planoId: i.planoId,
      totalDias: i.totalDias,
      inicio: i.inicio.paraIso(),
      diasConcluidos: [...i.diasConcluidos].sort((a, b) => a - b),
      diaInicial: i.diaInicial,
    });
  }

  async remover(id: InscricaoId): Promise<void> {
    await this.db.inscricoes.delete(id);
  }

  /** `null` para registro inválido (ex.: gravado por versão antiga ou importado corrompido). */
  private paraDominio(r: InscricaoRegistro): InscricaoPlano | null {
    try {
      return InscricaoPlano.criar(
        InscricaoId.de(r.id),
        PlanoId.de(r.planoId),
        r.totalDias,
        DataLocal.iso(r.inicio),
        r.diasConcluidos,
        r.diaInicial ?? 1,
      );
    } catch {
      return null;
    }
  }
}
