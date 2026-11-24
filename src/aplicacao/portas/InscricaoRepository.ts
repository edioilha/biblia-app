import type { InscricaoId, InscricaoPlano, PlanoId } from '../../dominio/planos';

/** Inscrições do leitor em planos: no máximo uma por plano. */
export interface InscricaoRepository {
  todas(): Promise<InscricaoPlano[]>;
  porId(id: InscricaoId): Promise<InscricaoPlano | null>;
  porPlano(plano: PlanoId): Promise<InscricaoPlano | null>;
  salvar(inscricao: InscricaoPlano): Promise<void>;
  remover(id: InscricaoId): Promise<void>;
}
