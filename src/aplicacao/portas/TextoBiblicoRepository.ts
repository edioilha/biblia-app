import type { Capitulo, CodigoLivro, Referencia, VersaoId } from '../../dominio/biblia';

/** Livro no formato de importação: `capitulos[i]` são os versículos [número, texto] do capítulo i + 1. */
export interface LivroImportado {
  readonly livro: CodigoLivro;
  readonly capitulos: readonly (readonly (readonly [numero: number, texto: string])[])[];
}

/** Texto bíblico por versão (porta implementada na infraestrutura). */
export interface TextoBiblicoRepository {
  /** `null` se o capítulo não estiver disponível na versão. */
  obterCapitulo(versao: VersaoId, ref: Referencia): Promise<Capitulo | null>;
  /** Indica se a versão foi importada por completo. */
  possuiVersao(versao: VersaoId): Promise<boolean>;
  /** Versões importadas por completo. */
  versoesInstaladas(): Promise<VersaoId[]>;
  /** Importa todos os livros da versão de forma atômica (tudo ou nada). */
  importar(versao: VersaoId, livros: readonly LivroImportado[]): Promise<void>;
  /** Apaga o texto da versão (RF07.5). Sem a versão, não faz nada. */
  removerVersao(versao: VersaoId): Promise<void>;
}
