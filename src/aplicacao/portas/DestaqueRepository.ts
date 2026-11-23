import type { Referencia, VersaoId } from '../../dominio/biblia';
import type { AlteracoesDestaques, Destaque, DestaqueId } from '../../dominio/estudo';

export interface DestaqueRepository {
  /** Destaques da versão no capítulo de `capitulo`. */
  porCapitulo(versao: VersaoId, capitulo: Referencia): Promise<Destaque[]>;
  porId(id: DestaqueId): Promise<Destaque | null>;
  /** Grava e remove numa única transação (os destaques nunca ficam sobrepostos). */
  aplicar(alteracoes: AlteracoesDestaques): Promise<void>;
}
