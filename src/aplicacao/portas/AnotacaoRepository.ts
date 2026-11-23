import type { Referencia } from '../../dominio/biblia';
import type { Anotacao, AnotacaoId } from '../../dominio/estudo';

export interface AnotacaoRepository {
  /** Anotações dos versículos do capítulo de `capitulo` (qualquer versão). */
  porCapitulo(capitulo: Referencia): Promise<Anotacao[]>;
  /** Todas as anotações (Meus Estudos, UC13). */
  todas(): Promise<Anotacao[]>;
  porId(id: AnotacaoId): Promise<Anotacao | null>;
  salvar(anotacao: Anotacao): Promise<void>;
  remover(id: AnotacaoId): Promise<void>;
}
