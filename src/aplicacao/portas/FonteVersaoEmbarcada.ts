import type { CodigoLivro, VersaoId } from '../../dominio/biblia';
import type { LivroImportado } from './TextoBiblicoRepository';

/** Origem do texto da versão distribuída com o app (arquivos estáticos em precache). */
export interface FonteVersaoEmbarcada {
  carregarLivro(versao: VersaoId, livro: CodigoLivro): Promise<LivroImportado>;
}
