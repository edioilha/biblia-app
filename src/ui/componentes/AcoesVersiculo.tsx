import { useEffect, useRef } from 'react';

interface Props {
  /** Ex.: "João 3:16". */
  rotulo: string;
  favoritado: boolean;
  onAlternarFavorito: () => void;
  onFechar: () => void;
}

/**
 * Barra de ações do versículo (UC04; Anotar entra em 7.4). Abre ao tocar no número do
 * versículo; recebe o foco ao abrir e fecha com Esc. Fixa no rodapé em qualquer tela,
 * para não depender de posicionamento junto ao texto.
 */
export function AcoesVersiculo({ rotulo, favoritado, onAlternarFavorito, onFechar }: Props) {
  const primeira = useRef<HTMLButtonElement>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    primeira.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      fechar.current();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  return (
    <div
      id="acoes-versiculo"
      role="region"
      aria-label={`Ações do versículo ${rotulo}`}
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
    >
      <div className="flex max-w-full items-center gap-1 rounded-full border border-stone-300 bg-white py-1.5 pr-1.5 pl-4 font-sans text-sm shadow-lg">
        <span className="mr-2 truncate font-serif font-semibold">{rotulo}</span>
        <button
          ref={primeira}
          type="button"
          onClick={onAlternarFavorito}
          className="focus-visible:outline-primaria rounded-full px-3 py-2 hover:bg-stone-100 focus-visible:outline-2"
        >
          <span aria-hidden="true" className="mr-1.5 text-amber-700">
            {favoritado ? '★' : '☆'}
          </span>
          {favoritado ? 'Remover favorito' : 'Favoritar'}
        </button>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar ações do versículo"
          className="focus-visible:outline-primaria flex size-9 items-center justify-center rounded-full text-lg hover:bg-stone-100 focus-visible:outline-2"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}
