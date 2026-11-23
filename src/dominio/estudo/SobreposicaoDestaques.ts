import { Destaque, type DestaqueId } from './Destaque';
import type { IntervaloTexto } from './IntervaloTexto';
import type { TextoDoCapitulo } from './TextoDoCapitulo';

/** O que gravar para manter os destaques de um capítulo consistentes. */
export interface AlteracoesDestaques {
  readonly salvar: readonly Destaque[];
  readonly remover: readonly DestaqueId[];
}

/**
 * Domain service com a regra de sobreposição (UC05, decisão da fase 7.3): os destaques de
 * um capítulo **nunca se sobrepõem**.
 * - mesma cor, sobrepondo ou separados só por espaço → fundem-se (A1);
 * - cor diferente → o mais recente vence: o antigo é cortado (ou dividido em dois).
 */
export class SobreposicaoDestaques {
  constructor(
    private readonly texto: TextoDoCapitulo,
    private readonly novoId: () => DestaqueId,
  ) {}

  /**
   * Aplica `destaque` (novo, ou existente com outra cor) sobre os `existentes` do capítulo.
   * Devolve o destaque resultante (talvez fundido, com outro id) e as alterações.
   */
  aplicar(
    destaque: Destaque,
    existentes: readonly Destaque[],
  ): { destaque: Destaque; alteracoes: AlteracoesDestaques } {
    const ids = new Set(existentes.map((e) => e.id));
    const outros = existentes.filter(
      (e) => e.id !== destaque.id && e.versaoId === destaque.versaoId,
    );

    // Funde até não haver mais vizinhos da mesma cor (uma fusão pode alcançar outro).
    let atual = destaque;
    const descartados = new Set<DestaqueId>();
    let fundiu = true;
    while (fundiu) {
      fundiu = false;
      for (const e of outros) {
        if (descartados.has(e.id) || e.cor !== atual.cor || !this.juntos(e, atual)) continue;
        const fundido = atual.fundirCom(e);
        descartados.add(fundido.id === e.id ? atual.id : e.id);
        atual = fundido;
        fundiu = true;
      }
    }

    const salvar: Destaque[] = [atual];
    const remover = [...descartados].filter((id) => id !== atual.id && ids.has(id));
    for (const e of outros) {
      if (descartados.has(e.id) || e.id === atual.id) continue;
      this.recortar(e, atual.intervalo, salvar, remover);
    }
    return { destaque: atual, alteracoes: { salvar, remover } };
  }

  /** Borracha: tira `trecho` de todos os destaques que o cobrem (RF04.4). */
  apagar(trecho: IntervaloTexto, existentes: readonly Destaque[]): AlteracoesDestaques {
    const salvar: Destaque[] = [];
    const remover: DestaqueId[] = [];
    for (const e of existentes) this.recortar(e, trecho, salvar, remover);
    return { salvar, remover };
  }

  private recortar(
    e: Destaque,
    trecho: IntervaloTexto,
    salvar: Destaque[],
    remover: DestaqueId[],
  ): void {
    if (!e.intervalo.sobrepoe(trecho)) return;
    const [primeiro, segundo] = e.intervalo
      .subtrair(trecho)
      .flatMap((p) => this.texto.aparar(p) ?? []);
    if (!primeiro) {
      remover.push(e.id);
      return;
    }
    salvar.push(e.comIntervalo(primeiro));
    if (segundo) {
      salvar.push(Destaque.criar(this.novoId(), e.versaoId, segundo, e.cor, e.criadoEm));
    }
  }

  /** Sobrepõem-se ou estão separados só por espaço. */
  private juntos(a: Destaque, b: Destaque): boolean {
    if (a.intervalo.sobrepoe(b.intervalo)) return true;
    const [antes, depois] =
      a.intervalo.inicio.compararCom(b.intervalo.inicio) <= 0 ? [a, b] : [b, a];
    return this.texto.soEspacoEntre(antes.intervalo.fim, depois.intervalo.inicio);
  }
}
