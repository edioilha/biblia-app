import type { VersaoId } from '../../dominio/biblia';
import { Destaque, DestaqueId, type CorDestaque, type IntervaloTexto } from '../../dominio/estudo';
import { ErroAplicacao } from '../ErroAplicacao';
import type { DestaqueRepository, GeradorId, Relogio, TextoBiblicoRepository } from '../portas';
import { contextoDestaques } from './contextoDestaques';

export class TrechoSemTextoError extends ErroAplicacao {
  constructor() {
    super('A seleção não tem texto para marcar.');
  }
}

/**
 * UC05 — Marcar texto (RF04.1–RF04.3, RF04.5): ajusta a seleção a palavras inteiras e
 * aplica a regra de sobreposição. Devolve o destaque resultante (talvez fundido).
 */
export class MarcarTexto {
  constructor(
    private readonly texto: TextoBiblicoRepository,
    private readonly destaques: DestaqueRepository,
    private readonly relogio: Relogio,
    private readonly gerador: GeradorId,
  ) {}

  private deps() {
    return { texto: this.texto, destaques: this.destaques, gerador: this.gerador };
  }

  async executar(versao: VersaoId, selecao: IntervaloTexto, cor: CorDestaque): Promise<Destaque> {
    const { texto, regras, existentes } = await contextoDestaques(
      this.deps(),
      versao,
      selecao.capitulo,
    );
    const trecho = texto.ajustarAPalavras(selecao);
    if (!trecho) throw new TrechoSemTextoError();

    const novo = Destaque.criar(
      DestaqueId.de(this.gerador.novo()),
      versao,
      trecho,
      cor,
      this.relogio.agora(),
    );
    const { destaque, alteracoes } = regras.aplicar(novo, existentes);
    await this.destaques.aplicar(alteracoes);
    return destaque;
  }
}
