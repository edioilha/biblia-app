import type { Versao, VersaoId } from '../../dominio/biblia';

/** Versões que o app distribui (ADR 0007: lista explícita, só domínio público). */
export interface CatalogoVersoes {
  /** Na ordem de exibição; a padrão primeiro. */
  todas(): readonly Versao[];
  padrao(): Versao;
  /** `null` se a sigla não estiver no catálogo. */
  porId(id: VersaoId): Versao | null;
}
