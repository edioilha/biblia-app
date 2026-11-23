import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Capitulo } from '../../dominio/biblia';
import type { IntervaloTexto } from '../../dominio/estudo';
import { intervaloDaSelecao } from '../componentes/selecaoTexto';

/**
 * UC05 passos 1–2 — acompanha a seleção de texto dentro de `raiz` e a converte num
 * `IntervaloTexto` do capítulo exibido. Tocar na barra de ações (`barra`) pode desfazer a
 * seleção no celular; nesse caso o último intervalo é mantido até a barra ser fechada.
 */
export function useSelecaoTexto(
  raiz: RefObject<HTMLElement | null>,
  barra: RefObject<HTMLElement | null>,
  capitulo: Capitulo | null,
  /** Chamado quando o leitor começa uma seleção (ex.: fechar outras barras). */
  aoSelecionar?: () => void,
) {
  const [selecao, setSelecao] = useState<IntervaloTexto | null>(null);
  const naBarra = useRef(false);
  const selecionou = useRef(aoSelecionar);
  useEffect(() => {
    selecionou.current = aoSelecionar;
  });

  useEffect(() => {
    if (!capitulo) return;
    function aoApertar(e: PointerEvent) {
      naBarra.current = e.target instanceof Node && !!barra.current?.contains(e.target);
    }
    function aoMudarSelecao() {
      const s = document.getSelection();
      const range = s && s.rangeCount > 0 ? s.getRangeAt(0) : null;
      if (!range || range.collapsed) {
        if (!naBarra.current) setSelecao(null);
        return;
      }
      const el = raiz.current;
      if (!el || !capitulo || !range.intersectsNode(el)) {
        setSelecao(null);
        return;
      }
      const novo = intervaloDaSelecao(range, el, capitulo);
      if (novo) selecionou.current?.();
      setSelecao((atual) => (novo && atual?.equals(novo) ? atual : novo));
    }
    document.addEventListener('pointerdown', aoApertar, true);
    document.addEventListener('selectionchange', aoMudarSelecao);
    return () => {
      document.removeEventListener('pointerdown', aoApertar, true);
      document.removeEventListener('selectionchange', aoMudarSelecao);
      setSelecao(null);
    };
  }, [raiz, barra, capitulo]);

  /** Fecha: desfaz a seleção do documento e esquece o intervalo. */
  const limpar = useCallback(() => {
    naBarra.current = false;
    document.getSelection()?.removeAllRanges();
    setSelecao(null);
  }, []);

  return { selecao, limpar };
}
