import { ErroDominio } from '../compartilhado/ErroDominio';

export class ConfiguracaoLeituraInvalidaError extends ErroDominio {}

/** RF01.7 — tema do app inteiro (UC12). */
export type Tema = 'CLARO' | 'SEPIA' | 'ESCURO';

const TEMAS: readonly Tema[] = ['CLARO', 'SEPIA', 'ESCURO'];

export const Tema = {
  todos: TEMAS,
  de(valor: string): Tema {
    const tema = TEMAS.find((t) => t === valor);
    if (!tema) throw new ConfiguracaoLeituraInvalidaError(`Tema inválido: "${valor}".`);
    return tema;
  },
};

/** Níveis do tamanho da fonte da leitura (A− / A+): 1 = menor, 7 = maior. */
export const TAMANHO_MINIMO = 1;
export const TAMANHO_MAXIMO = 7;
export const TAMANHO_PADRAO = 3;

/**
 * Como o leitor quer ver o texto (UC12, RF01.7): tema e tamanho da fonte, num nível de
 * 1 a 7 (a interface converte em tamanho). Value object imutável.
 */
export class ConfiguracaoLeitura {
  private constructor(
    readonly tema: Tema,
    readonly tamanhoFonte: number,
  ) {}

  static readonly padrao = new ConfiguracaoLeitura('CLARO', TAMANHO_PADRAO);

  static criar(tema: Tema, tamanhoFonte: number): ConfiguracaoLeitura {
    if (
      !Number.isInteger(tamanhoFonte) ||
      tamanhoFonte < TAMANHO_MINIMO ||
      tamanhoFonte > TAMANHO_MAXIMO
    ) {
      throw new ConfiguracaoLeituraInvalidaError(
        `Tamanho da fonte fora de ${TAMANHO_MINIMO}–${TAMANHO_MAXIMO}: ${tamanhoFonte}.`,
      );
    }
    return new ConfiguracaoLeitura(tema, tamanhoFonte);
  }

  get podeAumentar(): boolean {
    return this.tamanhoFonte < TAMANHO_MAXIMO;
  }

  get podeDiminuir(): boolean {
    return this.tamanhoFonte > TAMANHO_MINIMO;
  }

  /** A+ (no limite, devolve a mesma configuração). */
  aumentar(): ConfiguracaoLeitura {
    return this.podeAumentar ? new ConfiguracaoLeitura(this.tema, this.tamanhoFonte + 1) : this;
  }

  /** A− (no limite, devolve a mesma configuração). */
  diminuir(): ConfiguracaoLeitura {
    return this.podeDiminuir ? new ConfiguracaoLeitura(this.tema, this.tamanhoFonte - 1) : this;
  }

  comTema(tema: Tema): ConfiguracaoLeitura {
    return tema === this.tema ? this : new ConfiguracaoLeitura(tema, this.tamanhoFonte);
  }

  equals(outra: ConfiguracaoLeitura): boolean {
    return this.tema === outra.tema && this.tamanhoFonte === outra.tamanhoFonte;
  }
}
