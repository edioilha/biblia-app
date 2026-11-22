import type { Referencia, VersaoId } from '../biblia';

/**
 * Preferências do leitor (aggregate root, registro único). Imutável: cada alteração
 * devolve uma nova instância, que o caso de uso persiste.
 * Tema, tamanho da fonte e exibição de notas entram com UC12.
 */
export class Preferencias {
  private constructor(
    readonly versaoAtiva: VersaoId,
    readonly ultimaPosicao: Referencia,
  ) {}

  static criar(versaoAtiva: VersaoId, ultimaPosicao: Referencia): Preferencias {
    return new Preferencias(versaoAtiva, ultimaPosicao.doCapitulo());
  }

  /** Registra o capítulo lido (a posição é guardada no nível do capítulo). */
  comPosicao(ref: Referencia): Preferencias {
    const capitulo = ref.doCapitulo();
    return capitulo.equals(this.ultimaPosicao)
      ? this
      : new Preferencias(this.versaoAtiva, capitulo);
  }
}
