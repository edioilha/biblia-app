import { DadosDoLeitor, mesclarDados, type ResumoImportacao } from '../../dominio/backup';
import { DataLocal } from '../../dominio/planos';
import { ErroAplicacao } from '../ErroAplicacao';
import type { ArmazenamentoDadosLeitor, FormatoBackup, Relogio } from '../portas';

/** Arquivo que não é um backup do app, de formato mais novo ou com dados inválidos. */
export class BackupInvalidoError extends ErroAplicacao {}

export interface Totais {
  readonly favoritos: number;
  readonly destaques: number;
  readonly anotacoes: number;
  readonly inscricoes: number;
}

export interface BackupExportado {
  /** Ex.: "biblia-app-backup-2026-11-24.json". */
  readonly nomeArquivo: string;
  readonly conteudo: string;
  readonly totais: Totais;
}

/** UC11 — Exportar: todos os dados do leitor num arquivo JSON (RF08.1). */
export class ExportarDados {
  constructor(
    private readonly armazenamento: ArmazenamentoDadosLeitor,
    private readonly formato: FormatoBackup,
    private readonly relogio: Relogio,
  ) {}

  async executar(): Promise<BackupExportado> {
    const agora = this.relogio.agora();
    const dados = await this.armazenamento.ler();
    return {
      nomeArquivo: `biblia-app-backup-${DataLocal.de(agora).paraIso()}.json`,
      conteudo: this.formato.serializar(dados, agora),
      totais: DadosDoLeitor.totais(dados),
    };
  }
}

export interface PreviaImportacao {
  readonly exportadoEm: Date;
  /** O que o arquivo traz. */
  readonly totais: Totais;
  /** O que vai acontecer ao juntar com os dados atuais. */
  readonly resumo: ResumoImportacao;
}

/**
 * UC11 — Importar juntando (RF08.2): `analisar` lê e valida o arquivo e mostra o que
 * acontecerá; `executar` grava, numa transação. A regra de juntar está em `mesclarDados`.
 */
export class ImportarDados {
  constructor(
    private readonly armazenamento: ArmazenamentoDadosLeitor,
    private readonly formato: FormatoBackup,
  ) {}

  async analisar(conteudo: string): Promise<PreviaImportacao> {
    const arquivo = this.formato.ler(conteudo);
    const { resumo } = mesclarDados(await this.armazenamento.ler(), arquivo.dados);
    return {
      exportadoEm: arquivo.exportadoEm,
      totais: DadosDoLeitor.totais(arquivo.dados),
      resumo,
    };
  }

  /** Junta de novo com os dados do momento (podem ter mudado desde a análise). */
  async executar(conteudo: string): Promise<ResumoImportacao> {
    const arquivo = this.formato.ler(conteudo);
    const { alteracoes, resumo } = mesclarDados(await this.armazenamento.ler(), arquivo.dados);
    await this.armazenamento.aplicar(alteracoes);
    return resumo;
  }
}
