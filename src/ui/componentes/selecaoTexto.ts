import type { Capitulo } from '../../dominio/biblia';
import { IntervaloTexto, PosicaoTexto } from '../../dominio/estudo';

/** Atributo do elemento que contém só o texto de um versículo (sem o número). */
export const ATRIBUTO_TEXTO = 'data-texto-versiculo';

/**
 * UC05 passo 4 — converte uma seleção do DOM num `IntervaloTexto`. Os offsets contam só o
 * texto dos versículos (elementos com ATRIBUTO_TEXTO): número do versículo, títulos e o
 * espaço entre versículos são ignorados (A3). Uma ponta fora de qualquer texto é levada ao
 * texto mais próximo dentro da seleção. `null` se a seleção não alcança texto bíblico.
 */
export function intervaloDaSelecao(
  range: Range,
  raiz: Element,
  capitulo: Capitulo,
): IntervaloTexto | null {
  if (range.collapsed) return null;
  const textos = [...raiz.querySelectorAll<HTMLElement>(`[${ATRIBUTO_TEXTO}]`)];
  const posicao = (indice: number, offset: number) => {
    const numero = Number(textos[indice]?.getAttribute(ATRIBUTO_TEXTO));
    const versiculo = capitulo.versiculo(numero);
    return versiculo ? PosicaoTexto.em(versiculo.referencia, offset) : null;
  };

  // Início: primeiro texto que termina depois do ponto inicial.
  const i = textos.findIndex((el) => comparar(el, range.startContainer, range.startOffset) <= 0);
  // Fim: último texto que começa antes do ponto final.
  const f = textos.findLastIndex((el) => comparar(el, range.endContainer, range.endOffset) >= 0);
  const elInicio = textos[i];
  const elFim = textos[f];
  if (!elInicio || !elFim || i > f) return null;

  const de =
    comparar(elInicio, range.startContainer, range.startOffset) < 0
      ? 0
      : comprimentoAte(elInicio, range.startContainer, range.startOffset);
  const ate =
    comparar(elFim, range.endContainer, range.endOffset) > 0
      ? (elFim.textContent ?? '').length
      : comprimentoAte(elFim, range.endContainer, range.endOffset);
  if (i === f && de >= ate) return null;

  const inicio = posicao(i, de);
  const fim = posicao(f, ate);
  return inicio && fim ? IntervaloTexto.criar(inicio, fim) : null;
}

/** -1: o ponto está antes de `el`; 0: dentro; 1: depois. */
function comparar(el: Element, no: Node, offset: number): number {
  const conteudo = document.createRange();
  conteudo.selectNodeContents(el);
  return conteudo.comparePoint(no, offset);
}

/** Quantos caracteres de texto há em `el` antes do ponto (que está dentro de `el`). */
function comprimentoAte(el: Element, no: Node, offset: number): number {
  const antes = document.createRange();
  antes.selectNodeContents(el);
  antes.setEnd(no, offset);
  return antes.toString().length;
}
