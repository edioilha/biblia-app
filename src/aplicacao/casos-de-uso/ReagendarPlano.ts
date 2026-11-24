import { DataLocal, type InscricaoId, type InscricaoPlano } from '../../dominio/planos';
import type { InscricaoRepository, Relogio } from '../portas';
import { AlterarInscricao } from './planosSeguidos';

/** UC08 A2 — reagenda: o primeiro dia pendente passa a ser hoje (RF06.5). */
export class ReagendarPlano extends AlterarInscricao {
  constructor(
    inscricoes: InscricaoRepository,
    private readonly relogio: Relogio,
  ) {
    super(inscricoes);
  }

  async executar(id: InscricaoId): Promise<InscricaoPlano> {
    return this.alterar(id, (i) => i.reagendar(DataLocal.de(this.relogio.agora())));
  }
}
