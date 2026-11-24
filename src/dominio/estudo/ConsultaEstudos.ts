import type { Canon, CodigoLivro, Referencia } from '../biblia';
import { normalizarTermo, palavras } from '../busca';
import { ErroDominio } from '../compartilhado/ErroDominio';
import type { Anotacao } from './Anotacao';
import type { Destaque } from './Destaque';
import type { Favorito } from './Favorito';

export class ConsultaEstudosInvalidaError extends ErroDominio {}

/** RF09.1 — abas de Meus Estudos, na ordem de exibição (a primeira é a padrão). */
export type AbaEstudos = 'FAVORITOS' | 'DESTAQUES' | 'ANOTACOES';

const ABAS: readonly AbaEstudos[] = ['FAVORITOS', 'DESTAQUES', 'ANOTACOES'];

export const AbaEstudos = {
  todas: ABAS,
  padrao: 'FAVORITOS' as AbaEstudos,
};

/** RF09.3 — ordem bíblica (padrão) ou do mais recente para o mais antigo. */
export type OrdemEstudos = 'BIBLICA' | 'RECENTES';

export const OrdemEstudos = {
  todas: ['BIBLICA', 'RECENTES'] as readonly OrdemEstudos[],
  padrao: 'BIBLICA' as OrdemEstudos,
};

/** RF09.4 — itens por página. */
export const TAMANHO_PAGINA_ESTUDOS = 20;

/**
 * Item de uma aba de Meus Estudos com o texto a exibir: o versículo (favoritos e anotações)
 * ou só o trecho marcado (destaques) — wireframe docs/05 §3, nota 4.
 */
export type ItemEstudo =
  | { readonly tipo: 'FAVORITO'; readonly favorito: Favorito; readonly texto: string }
  | { readonly tipo: 'DESTAQUE'; readonly destaque: Destaque; readonly texto: string }
  | { readonly tipo: 'ANOTACAO'; readonly anotacao: Anotacao; readonly texto: string };

/** Marcação de uma aba, ainda sem o texto bíblico. */
export type MarcacaoEstudo =
  | { readonly tipo: 'FAVORITO'; readonly favorito: Favorito }
  | { readonly tipo: 'DESTAQUE'; readonly destaque: Destaque }
  | { readonly tipo: 'ANOTACAO'; readonly anotacao: Anotacao };

/** Versículo onde a marcação começa (abrir no contexto, ordem bíblica, filtro por livro). */
export function referenciaDaMarcacao(m: MarcacaoEstudo): Referencia {
  switch (m.tipo) {
    case 'FAVORITO':
      return m.favorito.referencia;
    case 'DESTAQUE':
      return m.destaque.intervalo.inicio.versiculo;
    case 'ANOTACAO':
      return m.anotacao.referencia;
  }
}

/** Data mostrada e usada na ordem "mais recentes": a última edição, no caso das notas. */
export function dataDaMarcacao(m: MarcacaoEstudo): Date {
  switch (m.tipo) {
    case 'FAVORITO':
      return m.favorito.criadoEm;
    case 'DESTAQUE':
      return m.destaque.criadoEm;
    case 'ANOTACAO':
      return m.anotacao.atualizadoEm;
  }
}

export interface OpcoesConsultaEstudos {
  readonly aba?: AbaEstudos;
  readonly texto?: string;
  readonly livro?: CodigoLivro | null;
  readonly ordem?: OrdemEstudos;
  readonly pagina?: number;
  readonly tamanhoPagina?: number;
}

/**
 * UC13 — o que listar em Meus Estudos (RF09.2–RF09.4). Value object imutável.
 * O filtro de texto ignora acentos e maiúsculas (como a busca, RF02.2) e exige todas as
 * palavras, em qualquer ordem e mesmo como parte de outra ("graça" acha "graças").
 */
export class ConsultaEstudos {
  /** Palavras do filtro, normalizadas. Vazio = sem filtro de texto. */
  readonly palavras: readonly string[];

  private constructor(
    readonly aba: AbaEstudos,
    readonly texto: string,
    readonly livro: CodigoLivro | null,
    readonly ordem: OrdemEstudos,
    readonly pagina: number,
    readonly tamanhoPagina: number,
  ) {
    this.palavras = palavras(texto).map(normalizarTermo);
  }

  static criar({
    aba = AbaEstudos.padrao,
    texto = '',
    livro = null,
    ordem = OrdemEstudos.padrao,
    pagina = 1,
    tamanhoPagina = TAMANHO_PAGINA_ESTUDOS,
  }: OpcoesConsultaEstudos = {}): ConsultaEstudos {
    if (!Number.isInteger(pagina) || pagina < 1) {
      throw new ConsultaEstudosInvalidaError(`Página inválida: ${pagina}.`);
    }
    if (!Number.isInteger(tamanhoPagina) || tamanhoPagina < 1) {
      throw new ConsultaEstudosInvalidaError(`Tamanho de página inválido: ${tamanhoPagina}.`);
    }
    return new ConsultaEstudos(aba, texto.trim(), livro, ordem, pagina, tamanhoPagina);
  }

  get filtraTexto(): boolean {
    return this.palavras.length > 0;
  }

  /** RF09.2 — filtro por livro. */
  doLivro(m: MarcacaoEstudo): boolean {
    return this.livro === null || referenciaDaMarcacao(m).livro.equals(this.livro);
  }

  /** RF09.2 — filtro de texto no versículo (ou trecho) e, nas anotações, na nota. */
  correspondeTexto(m: MarcacaoEstudo, texto: string): boolean {
    if (!this.filtraTexto) return true;
    const alvo = normalizarTermo(
      m.tipo === 'ANOTACAO' ? `${texto}\n${m.anotacao.conteudo}` : texto,
    );
    return this.palavras.every((p) => alvo.includes(p));
  }

  /** RF09.3 — compara para ordenar; empates seguem a ordem bíblica e o trecho. */
  comparar(a: MarcacaoEstudo, b: MarcacaoEstudo, canon: Canon): number {
    const biblica =
      referenciaDaMarcacao(a).compararCom(referenciaDaMarcacao(b), canon) ||
      offset(a) - offset(b) ||
      dataDaMarcacao(a).getTime() - dataDaMarcacao(b).getTime();
    if (this.ordem === 'BIBLICA') return biblica;
    return dataDaMarcacao(b).getTime() - dataDaMarcacao(a).getTime() || biblica;
  }
}

const offset = (m: MarcacaoEstudo) =>
  m.tipo === 'DESTAQUE' ? m.destaque.intervalo.inicio.offset : 0;
