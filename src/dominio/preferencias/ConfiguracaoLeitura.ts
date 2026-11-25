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

/**
 * BL-01 — largura da página de leitura em telas a partir de 768 px (no celular a página já
 * ocupa a tela). Estreita é a de sempre; as outras alargam a página e as margens internas.
 */
export type LarguraPagina = 'ESTREITA' | 'MEDIA' | 'LARGA';

const LARGURAS: readonly LarguraPagina[] = ['ESTREITA', 'MEDIA', 'LARGA'];

export const LarguraPagina = {
  todas: LARGURAS,
  padrao: 'ESTREITA' as LarguraPagina,
  de(valor: string): LarguraPagina {
    const largura = LARGURAS.find((l) => l === valor);
    if (!largura) throw new ConfiguracaoLeituraInvalidaError(`Largura inválida: "${valor}".`);
    return largura;
  },
};

/** Níveis do tamanho da fonte da leitura (A− / A+): 1 = menor, 7 = maior. */
export const TAMANHO_MINIMO = 1;
export const TAMANHO_MAXIMO = 7;
export const TAMANHO_PADRAO = 3;

/**
 * Como o leitor quer ver o texto (UC12, RF01.7): tema, tamanho da fonte num nível de 1 a 7
 * (a interface converte em tamanho) e largura da página (BL-01). Value object imutável.
 */
export class ConfiguracaoLeitura {
  private constructor(
    readonly tema: Tema,
    readonly tamanhoFonte: number,
    readonly largura: LarguraPagina,
  ) {}

  static readonly padrao = new ConfiguracaoLeitura('CLARO', TAMANHO_PADRAO, LarguraPagina.padrao);

  static criar(
    tema: Tema,
    tamanhoFonte: number,
    largura: LarguraPagina = LarguraPagina.padrao,
  ): ConfiguracaoLeitura {
    if (
      !Number.isInteger(tamanhoFonte) ||
      tamanhoFonte < TAMANHO_MINIMO ||
      tamanhoFonte > TAMANHO_MAXIMO
    ) {
      throw new ConfiguracaoLeituraInvalidaError(
        `Tamanho da fonte fora de ${TAMANHO_MINIMO}–${TAMANHO_MAXIMO}: ${tamanhoFonte}.`,
      );
    }
    return new ConfiguracaoLeitura(tema, tamanhoFonte, largura);
  }

  get podeAumentar(): boolean {
    return this.tamanhoFonte < TAMANHO_MAXIMO;
  }

  get podeDiminuir(): boolean {
    return this.tamanhoFonte > TAMANHO_MINIMO;
  }

  /** A+ (no limite, devolve a mesma configuração). */
  aumentar(): ConfiguracaoLeitura {
    return this.podeAumentar ? this.com({ tamanhoFonte: this.tamanhoFonte + 1 }) : this;
  }

  /** A− (no limite, devolve a mesma configuração). */
  diminuir(): ConfiguracaoLeitura {
    return this.podeDiminuir ? this.com({ tamanhoFonte: this.tamanhoFonte - 1 }) : this;
  }

  comTema(tema: Tema): ConfiguracaoLeitura {
    return tema === this.tema ? this : this.com({ tema });
  }

  /** BL-01 — troca a largura da página mantendo tema e tamanho. */
  comLargura(largura: LarguraPagina): ConfiguracaoLeitura {
    return largura === this.largura ? this : this.com({ largura });
  }

  equals(outra: ConfiguracaoLeitura): boolean {
    return (
      this.tema === outra.tema &&
      this.tamanhoFonte === outra.tamanhoFonte &&
      this.largura === outra.largura
    );
  }

  private com(m: { tema?: Tema; tamanhoFonte?: number; largura?: LarguraPagina }) {
    return new ConfiguracaoLeitura(
      m.tema ?? this.tema,
      m.tamanhoFonte ?? this.tamanhoFonte,
      m.largura ?? this.largura,
    );
  }
}
