import type { VersaoId } from '../../dominio/biblia';
import type { IntervaloTexto } from '../../dominio/estudo';
import type { DestaqueRepository, GeradorId, TextoBiblicoRepository } from '../portas';
import { contextoDestaques } from './contextoDestaques';

/**
 * UC05 A2 — borracha (RF04.4): tira o trecho de todos os destaques que o cobrem. O trecho
 * não é ajustado a palavras (apaga exatamente o selecionado). Devolve se algo mudou.
 */
export class DesmarcarTexto {
  constructor(
    private readonly texto: TextoBiblicoRepository,
    private readonly destaques: DestaqueRepository,
    private readonly gerador: GeradorId,
  ) {}

  private deps() {
    return { texto: this.texto, destaques: this.destaques, gerador: this.gerador };
  }

  async executar(versao: VersaoId, trecho: IntervaloTexto): Promise<boolean> {
    const { texto, regras, existentes } = await contextoDestaques(
      this.deps(),
      versao,
      trecho.capitulo,
    );
    texto.validar(trecho);
    const alteracoes = regras.apagar(trecho, existentes);
    if (alteracoes.salvar.length === 0 && alteracoes.remover.length === 0) return false;
    await this.destaques.aplicar(alteracoes);
    return true;
  }
}
