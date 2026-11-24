import type { DadosDoLeitor } from '../../dominio/backup';

export interface ArquivoBackup {
  readonly exportadoEm: Date;
  readonly dados: DadosDoLeitor;
}

/** Formato do arquivo de backup (UC11). `ler` lança `BackupInvalidoError`. */
export interface FormatoBackup {
  serializar(dados: DadosDoLeitor, exportadoEm: Date): string;
  ler(conteudo: string): ArquivoBackup;
}
