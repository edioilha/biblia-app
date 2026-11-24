import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { DataLocal, type PlanoLeitura } from '../../dominio/planos';

interface Props {
  plano: PlanoLeitura;
  hoje: DataLocal;
  ocupado: boolean;
  erro?: string | null | undefined;
  onIniciar: (inicio: DataLocal) => void;
  onFechar: () => void;
}

/**
 * UC07 — escolhe a data de início (padrão: hoje) e inicia o plano. `<dialog>` modal (foco
 * preso e Esc nativos), montado só enquanto aberto.
 */
export function DialogoIniciarPlano({ plano, hoje, ocupado, erro, onIniciar, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const id = useId();
  const [inicio, setInicio] = useState(hoje.paraIso());
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    el.showModal();
    campo.current?.focus();
    const aoFechar = () => fechar.current();
    el.addEventListener('close', aoFechar);
    return () => el.removeEventListener('close', aoFechar);
  }, []);

  const data = (() => {
    try {
      return DataLocal.iso(inicio);
    } catch {
      return null;
    }
  })();
  const termino = data?.somarDias(plano.duracaoDias - 1);

  const iniciar = (e: FormEvent) => {
    e.preventDefault();
    if (data && !ocupado) onIniciar(data);
  };

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={`${id}-titulo`}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg bg-white p-0 font-sans shadow-2xl backdrop:bg-black/30"
    >
      <form onSubmit={iniciar} className="flex flex-col gap-4 p-5">
        <div>
          <h2 id={`${id}-titulo`} className="text-lg font-semibold">
            Iniciar “{plano.nome}”
          </h2>
          <p className="mt-1 text-sm text-stone-600">{plano.descricao}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-inicio`} className="text-sm font-medium">
            Data de início
          </label>
          <input
            ref={campo}
            id={`${id}-inicio`}
            type="date"
            required
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            aria-describedby={`${id}-termino`}
            className="focus-visible:outline-primaria rounded-md border border-stone-300 px-3 py-2 text-base focus-visible:outline-2"
          />
          <p id={`${id}-termino`} className="text-xs text-stone-600">
            {termino
              ? `${plano.duracaoDias} dias, terminando em ${termino.formatar()}.`
              : 'Escolha uma data válida.'}
          </p>
        </div>

        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="focus-visible:outline-primaria rounded-md px-3 py-2 text-sm hover:bg-stone-100 focus-visible:outline-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!data || ocupado}
            className="bg-primaria rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Iniciar plano
          </button>
        </div>
      </form>
    </dialog>
  );
}
