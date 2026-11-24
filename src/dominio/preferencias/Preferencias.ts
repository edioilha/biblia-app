import type { Referencia, VersaoId } from '../biblia';
import { ConfiguracaoLeitura } from './ConfiguracaoLeitura';

/**
 * Preferências do leitor (aggregate root, registro único). Imutável: cada alteração
 * devolve uma nova instância, que o caso de uso persiste.
 * Guarda a versão ativa (UC10), a última posição de leitura (UC01) e como ler (UC12).
 */
export class Preferencias {
  private constructor(
    readonly versaoAtiva: VersaoId,
    readonly ultimaPosicao: Referencia,
    readonly leitura: ConfiguracaoLeitura,
  ) {}

  static criar(
    versaoAtiva: VersaoId,
    ultimaPosicao: Referencia,
    leitura: ConfiguracaoLeitura = ConfiguracaoLeitura.padrao,
  ): Preferencias {
    return new Preferencias(versaoAtiva, ultimaPosicao.doCapitulo(), leitura);
  }

  /** UC10 — troca a versão ativa; a posição de leitura fica. */
  comVersao(versao: VersaoId): Preferencias {
    return versao === this.versaoAtiva
      ? this
      : new Preferencias(versao, this.ultimaPosicao, this.leitura);
  }

  /** UC12 — tema e tamanho da fonte. */
  comLeitura(leitura: ConfiguracaoLeitura): Preferencias {
    return leitura.equals(this.leitura)
      ? this
      : new Preferencias(this.versaoAtiva, this.ultimaPosicao, leitura);
  }

  /** Registra o capítulo lido (a posição é guardada no nível do capítulo). */
  comPosicao(ref: Referencia): Preferencias {
    const capitulo = ref.doCapitulo();
    return capitulo.equals(this.ultimaPosicao)
      ? this
      : new Preferencias(this.versaoAtiva, capitulo, this.leitura);
  }
}
