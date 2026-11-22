import type { Canon, Capitulo, Livro, Referencia, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import { ErroAplicacao } from '../ErroAplicacao';
import type { PreferenciasRepository, TextoBiblicoRepository } from '../portas';
import { primeiroCapitulo } from './ObterPosicaoInicial';

export class CapituloIndisponivelError extends ErroAplicacao {
  constructor(versao: VersaoId, ref: Referencia) {
    super(`Capítulo ${ref.chave()} indisponível na versão ${versao}.`);
  }
}

/**
 * Resultado de UC01. Favoritos, destaques e anotações do capítulo
 * entram aqui nas fases seguintes (RF03–RF05).
 */
export interface CapituloAberto {
  readonly capitulo: Capitulo;
  readonly livro: Livro;
  /** `null` em Gênesis 1. */
  readonly anterior: Referencia | null;
  /** `null` em Apocalipse 22. */
  readonly proximo: Referencia | null;
  /** Versículo a destacar ao abrir (UC02 "Jo 3:16"), ou `null`. */
  readonly versiculoEmFoco: number | null;
}

/** UC01 — Ler capítulo: carrega o texto na versão ativa e salva a posição de leitura. */
export class AbrirCapitulo {
  constructor(
    private readonly canon: Canon,
    private readonly texto: TextoBiblicoRepository,
    private readonly preferencias: PreferenciasRepository,
    private readonly versaoPadrao: VersaoId,
  ) {}

  async executar(ref: Referencia): Promise<CapituloAberto> {
    const salvas = await this.preferencias.obter();
    const prefs = salvas ?? Preferencias.criar(this.versaoPadrao, primeiroCapitulo(this.canon));

    const capitulo = await this.texto.obterCapitulo(prefs.versaoAtiva, ref.doCapitulo());
    if (!capitulo) throw new CapituloIndisponivelError(prefs.versaoAtiva, ref);

    const atualizadas = prefs.comPosicao(ref);
    if (!salvas || atualizadas !== salvas) await this.preferencias.salvar(atualizadas);

    return {
      capitulo,
      livro: this.canon.livro(ref.livro),
      anterior: this.canon.anterior(ref),
      proximo: this.canon.proximo(ref),
      versiculoEmFoco: ref.versiculo,
    };
  }
}
