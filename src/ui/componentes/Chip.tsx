import type { ReactNode } from 'react';

/**
 * Opção em forma de "chip": por baixo é um radio ou checkbox nativo (teclado e leitor de
 * tela de graça), escondido visualmente.
 */
export function Chip({
  tipo,
  nome,
  marcado,
  onMudar,
  children,
}: {
  tipo: 'radio' | 'checkbox';
  nome: string;
  marcado: boolean;
  onMudar: (marcado: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative inline-flex cursor-pointer">
      <input
        type={tipo}
        name={nome}
        checked={marcado}
        onChange={(e) => onMudar(e.target.checked)}
        className="peer sr-only"
      />
      <span className="peer-checked:bg-tinta peer-checked:border-tinta peer-focus-visible:outline-primaria peer-checked:text-sobre-tinta rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm whitespace-nowrap peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 hover:border-stone-400">
        {children}
      </span>
    </label>
  );
}
