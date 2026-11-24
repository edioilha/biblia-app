import type { Canon, VersaoId } from '../../dominio/biblia';
import type { FonteVersao, TextoBiblicoRepository } from '../portas';
import { carregarVersao, type ProgressoCarga } from './carregarVersao';

export type ProgressoPreparacao = ProgressoCarga;

/**
 * Pré-condição de UC01 ("ao menos uma versão instalada"): na primeira execução,
 * importa a versão embarcada (RF07.1) para o IndexedDB. Idempotente.
 */
export class PrepararVersaoPadrao {
  private emAndamento: Promise<void> | null = null;

  constructor(
    private readonly canon: Canon,
    private readonly fonte: FonteVersao,
    private readonly texto: TextoBiblicoRepository,
    private readonly versaoPadrao: VersaoId,
  ) {}

  /** Indica se é preciso importar (para a UI decidir se mostra a tela de preparação). */
  async necessaria(): Promise<boolean> {
    return !(await this.texto.possuiVersao(this.versaoPadrao));
  }

  /** Chamadas concorrentes compartilham a mesma importação (o progresso vai para a primeira). */
  executar(aoProgredir?: (p: ProgressoPreparacao) => void): Promise<void> {
    this.emAndamento ??= this.importar(aoProgredir).finally(() => {
      this.emAndamento = null;
    });
    return this.emAndamento;
  }

  private async importar(aoProgredir?: (p: ProgressoPreparacao) => void): Promise<void> {
    if (!(await this.necessaria())) return;
    // Arquivos locais (precache): sem limite de concorrência.
    const livros = await carregarVersao(this.canon, this.fonte, this.versaoPadrao, {
      aoProgredir,
    });
    await this.texto.importar(this.versaoPadrao, livros);
  }
}
