import { useEffect, useId, useRef } from 'react';

interface Props {
  titulo: string;
  mensagem: string;
  /** Rótulo do botão que confirma (ex.: "Remover favorito"). */
  confirmar: string;
  ocupado: boolean;
  /** Ação destrutiva (padrão): botão vermelho. */
  perigosa?: boolean;
  erro?: string | null | undefined;
  onConfirmar: () => void;
  onFechar: () => void;
}

/**
 * Confirmação de ação (destrutiva, por padrão) em `<dialog>` modal (foco preso e Esc nativos). O foco
 * começa em "Cancelar": Enter sem querer não apaga nada. Montado só enquanto aberto.
 */
export function DialogoConfirmacao({
  titulo,
  mensagem,
  confirmar,
  ocupado,
  perigosa = true,
  erro,
  onConfirmar,
  onFechar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const id = useId();
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    el.showModal();
    cancelar.current?.focus();
    const aoFechar = () => fechar.current();
    el.addEventListener('close', aoFechar);
    return () => el.removeEventListener('close', aoFechar);
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-mensagem`}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg bg-white p-0 font-sans shadow-2xl backdrop:bg-black/30"
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 id={`${id}-titulo`} className="text-lg font-semibold">
          {titulo}
        </h2>
        <p id={`${id}-mensagem`} className="text-sm text-stone-700">
          {mensagem}
        </p>
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            ref={cancelar}
            onClick={() => dialogo.current?.close()}
            className="focus-visible:outline-primaria rounded-md px-3 py-2 text-sm hover:bg-stone-100 focus-visible:outline-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={onConfirmar}
            className={`rounded-md px-3 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${perigosa ? 'bg-red-700 hover:bg-red-800 focus-visible:outline-red-700' : 'bg-primaria focus-visible:outline-primaria hover:opacity-90'}`}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
