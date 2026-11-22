import type { Canon, VersaoId } from '../../dominio/biblia';
import { ErroAplicacao } from '../ErroAplicacao';
import type { FonteVersaoEmbarcada, LivroImportado, TextoBiblicoRepository } from '../portas';

export class VersaoCorrompidaError extends ErroAplicacao {}

export interface ProgressoPreparacao {
  readonly concluidos: number;
  readonly total: number;
}

/**
 * Pré-condição de UC01 ("ao menos uma versão instalada"): na primeira execução,
 * importa a versão embarcada (RF07.1) para o IndexedDB. Idempotente.
 */
export class PrepararVersaoPadrao {
  constructor(
    private readonly canon: Canon,
    private readonly fonte: FonteVersaoEmbarcada,
    private readonly texto: TextoBiblicoRepository,
    private readonly versaoPadrao: VersaoId,
  ) {}

  /** Indica se é preciso importar (para a UI decidir se mostra a tela de preparação). */
  async necessaria(): Promise<boolean> {
    return !(await this.texto.possuiVersao(this.versaoPadrao));
  }

  async executar(aoProgredir?: (p: ProgressoPreparacao) => void): Promise<void> {
    if (!(await this.necessaria())) return;

    const livros = this.canon.livros();
    let concluidos = 0;
    const importados = await Promise.all(
      livros.map(async (livro) => {
        const importado = await this.fonte.carregarLivro(this.versaoPadrao, livro.codigo);
        this.validar(importado, livro.codigo.valor, livro.totalCapitulos);
        aoProgredir?.({ concluidos: ++concluidos, total: livros.length });
        return importado;
      }),
    );

    await this.texto.importar(this.versaoPadrao, importados);
  }

  private validar(importado: LivroImportado, codigo: string, totalCapitulos: number): void {
    if (importado.livro.valor !== codigo || importado.capitulos.length !== totalCapitulos) {
      throw new VersaoCorrompidaError(
        `${this.versaoPadrao}/${codigo}: esperado ${totalCapitulos} capítulos de ${codigo}, ` +
          `recebido ${importado.capitulos.length} de ${importado.livro.valor}.`,
      );
    }
  }
}
