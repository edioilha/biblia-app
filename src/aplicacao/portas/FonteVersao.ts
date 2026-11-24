import type { CodigoLivro, VersaoId } from '../../dominio/biblia';
import type { LivroImportado } from './TextoBiblicoRepository';

/**
 * Origem do texto de uma versão, livro a livro: os arquivos estáticos da versão embarcada
 * (precache) ou o biblia.data na instalação (UC09). Entrega o livro já normalizado.
 */
export interface FonteVersao {
  /** `sinal` cancela o download (UC09: "Cancelar"). */
  carregarLivro(versao: VersaoId, livro: CodigoLivro, sinal?: AbortSignal): Promise<LivroImportado>;
}
