import type { AlteracoesImportacao, DadosDoLeitor } from '../../dominio/backup';

/** Os dados do leitor de uma vez, para o backup (UC11). */
export interface ArmazenamentoDadosLeitor {
  /** Favoritos, destaques (de todas as versões), anotações e inscrições. */
  ler(): Promise<DadosDoLeitor>;
  /** Grava a importação numa única transação (tudo ou nada). */
  aplicar(alteracoes: AlteracoesImportacao): Promise<void>;
}
