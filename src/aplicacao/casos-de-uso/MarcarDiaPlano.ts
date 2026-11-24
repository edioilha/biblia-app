import type { InscricaoId, InscricaoPlano } from '../../dominio/planos';
import { AlterarInscricao } from './planosSeguidos';

/** UC08 passo 5 / A1 — conclui (ou desfaz) um dia do plano (RF06.4). */
export class MarcarDiaPlano extends AlterarInscricao {
  async executar(id: InscricaoId, dia: number, concluido: boolean): Promise<InscricaoPlano> {
    return this.alterar(id, (i) => (concluido ? i.concluirDia(dia) : i.desfazerDia(dia)));
  }
}
