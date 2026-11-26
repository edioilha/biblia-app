import { ErroDominio } from '../compartilhado/ErroDominio';

export class ConfiguracaoLeituraInvalidaError extends ErroDominio {}

/** Lista fechada de opções com validação do valor salvo (tema, largura, fonte, folha). */
function opcoes<T extends string>(todas: readonly T[], erro: string) {
  return {
    de(valor: string): T {
      const opcao = todas.find((o) => o === valor);
      if (!opcao) throw new ConfiguracaoLeituraInvalidaError(`${erro}: "${valor}".`);
      return opcao;
    },
  };
}

/** RF01.7 — tema do app inteiro (UC12). */
export type Tema = 'CLARO' | 'SEPIA' | 'ESCURO';

const TEMAS: readonly Tema[] = ['CLARO', 'SEPIA', 'ESCURO'];

export const Tema = { todos: TEMAS, ...opcoes(TEMAS, 'Tema inválido') };

/**
 * BL-01 — largura da página de leitura em telas a partir de 768 px (no celular a página já
 * ocupa a tela). Estreita é a de sempre; as outras alargam a página e as margens internas.
 */
export type LarguraPagina = 'ESTREITA' | 'MEDIA' | 'LARGA';

const LARGURAS: readonly LarguraPagina[] = ['ESTREITA', 'MEDIA', 'LARGA'];

export const LarguraPagina = {
  todas: LARGURAS,
  padrao: 'ESTREITA' as LarguraPagina,
  ...opcoes(LARGURAS, 'Largura inválida'),
};

/**
 * BL-02 — família da fonte do texto bíblico. Clássica é a serifada de sempre; Moderna e Sem
 * serifa usam fontes do sistema; Legível é a Atkinson Hyperlegible, embarcada no app.
 */
export type FamiliaFonte = 'CLASSICA' | 'MODERNA' | 'SEM_SERIFA' | 'LEGIVEL';

const FAMILIAS: readonly FamiliaFonte[] = ['CLASSICA', 'MODERNA', 'SEM_SERIFA', 'LEGIVEL'];

export const FamiliaFonte = {
  todas: FAMILIAS,
  padrao: 'CLASSICA' as FamiliaFonte,
  ...opcoes(FAMILIAS, 'Fonte inválida'),
};

/**
 * BL-03 — tipo de folha da página de leitura, em qualquer tema. Textura é a folha de sempre
 * (fibra sutil e vinheta); Liso tira a textura; Envelhecido reforça vinheta e manchas;
 * Pautado põe linhas alinhadas ao texto.
 */
export type TipoFolha = 'LISO' | 'TEXTURA' | 'ENVELHECIDO' | 'PAUTADO';

const FOLHAS: readonly TipoFolha[] = ['LISO', 'TEXTURA', 'ENVELHECIDO', 'PAUTADO'];

export const TipoFolha = {
  todas: FOLHAS,
  padrao: 'TEXTURA' as TipoFolha,
  ...opcoes(FOLHAS, 'Folha inválida'),
};

/** Níveis do tamanho da fonte da leitura (A− / A+): 1 = menor, 7 = maior. */
export const TAMANHO_MINIMO = 1;
export const TAMANHO_MAXIMO = 7;
export const TAMANHO_PADRAO = 3;

/**
 * Como o leitor quer ver o texto (UC12, RF01.7): tema, tamanho da fonte num nível de 1 a 7
 * (a interface converte em tamanho), largura da página (BL-01), família da fonte (BL-02) e
 * tipo de folha (BL-03). Value object imutável.
 */
export class ConfiguracaoLeitura {
  private constructor(
    readonly tema: Tema,
    readonly tamanhoFonte: number,
    readonly largura: LarguraPagina,
    readonly fonte: FamiliaFonte,
    readonly folha: TipoFolha,
  ) {}

  static readonly padrao = new ConfiguracaoLeitura(
    'CLARO',
    TAMANHO_PADRAO,
    LarguraPagina.padrao,
    FamiliaFonte.padrao,
    TipoFolha.padrao,
  );

  static criar(
    tema: Tema,
    tamanhoFonte: number,
    largura: LarguraPagina = LarguraPagina.padrao,
    fonte: FamiliaFonte = FamiliaFonte.padrao,
    folha: TipoFolha = TipoFolha.padrao,
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
    return new ConfiguracaoLeitura(tema, tamanhoFonte, largura, fonte, folha);
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

  /** BL-02 — troca a família da fonte mantendo o resto. */
  comFonte(fonte: FamiliaFonte): ConfiguracaoLeitura {
    return fonte === this.fonte ? this : this.com({ fonte });
  }

  /** BL-03 — troca o tipo de folha mantendo o resto. */
  comFolha(folha: TipoFolha): ConfiguracaoLeitura {
    return folha === this.folha ? this : this.com({ folha });
  }

  equals(outra: ConfiguracaoLeitura): boolean {
    return (
      this.tema === outra.tema &&
      this.tamanhoFonte === outra.tamanhoFonte &&
      this.largura === outra.largura &&
      this.fonte === outra.fonte &&
      this.folha === outra.folha
    );
  }

  private com(
    m: Partial<Pick<ConfiguracaoLeitura, 'tema' | 'tamanhoFonte' | 'largura' | 'fonte' | 'folha'>>,
  ) {
    return new ConfiguracaoLeitura(
      m.tema ?? this.tema,
      m.tamanhoFonte ?? this.tamanhoFonte,
      m.largura ?? this.largura,
      m.fonte ?? this.fonte,
      m.folha ?? this.folha,
    );
  }
}
