import { useEffect, useRef, type TouchEvent } from 'react';

const SWIPE_MIN_PX = 60;

function emCampoDeTexto(alvo: EventTarget | null): boolean {
  return (
    alvo instanceof HTMLElement &&
    (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))
  );
}

/**
 * RF01.3: teclas ← → e swipe horizontal para capítulo anterior/próximo.
 * Retorna os handlers de toque para o elemento da página.
 */
export function useNavegacaoCapitulos(
  irAnterior: (() => void) | null,
  irProximo: (() => void) | null,
) {
  const acoes = useRef({ irAnterior, irProximo });
  useEffect(() => {
    acoes.current = { irAnterior, irProximo };
  });

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || emCampoDeTexto(e.target)) return;
      if (document.querySelector('dialog[open]')) return;
      const acao =
        e.key === 'ArrowLeft'
          ? acoes.current.irAnterior
          : e.key === 'ArrowRight'
            ? acoes.current.irProximo
            : null;
      if (acao) {
        e.preventDefault();
        acao();
      }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  const inicio = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      inicio.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0];
      const de = inicio.current;
      inicio.current = null;
      if (!de || !t || !window.getSelection()?.isCollapsed) return;
      const dx = t.clientX - de.x;
      const dy = t.clientY - de.y;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < 2 * Math.abs(dy)) return;
      (dx > 0 ? acoes.current.irAnterior : acoes.current.irProximo)?.();
    },
  };
}
