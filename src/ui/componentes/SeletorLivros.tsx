import { useEffect, useId, useRef, useState } from 'react';
import type { Livro, Testamento } from '../../dominio/biblia';

const NOME_TESTAMENTO: Record<Testamento, string> = {
  ANTIGO: 'Antigo Testamento',
  NOVO: 'Novo Testamento',
};

/** Texto do botão: "Livros: todos", "Livros: João, Romanos" ou "Livros: 5". */
function resumo(selecionados: readonly Livro[]): string {
  if (selecionados.length === 0) return 'todos';
  if (selecionados.length <= 2) return selecionados.map((l) => l.nome).join(', ');
  return `${selecionados.length}`;
}

/** RF02.5 — escolha de livros num diálogo com caixas de marcar agrupadas por testamento. */
export function SeletorLivros({
  disponiveis,
  selecionados,
  onAplicar,
}: {
  disponiveis: readonly Livro[];
  selecionados: readonly Livro[];
  onAplicar: (codigos: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        className={`focus-visible:outline-primaria rounded-full border px-3 py-1.5 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${selecionados.length ? 'bg-tinta border-tinta text-sobre-tinta' : 'border-stone-300 bg-white hover:border-stone-400'}`}
      >
        Livros: {resumo(selecionados)} <span aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <DialogoLivros
          disponiveis={disponiveis}
          selecionados={selecionados}
          onAplicar={(codigos) => {
            onAplicar(codigos);
            setAberto(false);
            requestAnimationFrame(() => botao.current?.focus());
          }}
          onFechar={() => {
            setAberto(false);
            requestAnimationFrame(() => botao.current?.focus());
          }}
        />
      )}
    </>
  );
}

function DialogoLivros({
  disponiveis,
  selecionados,
  onAplicar,
  onFechar,
}: {
  disponiveis: readonly Livro[];
  selecionados: readonly Livro[];
  onAplicar: (codigos: string[]) => void;
  onFechar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [marcados, setMarcados] = useState(
    () => new Set<string>(selecionados.map((l) => l.codigo.valor)),
  );
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });
  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    el.showModal();
    const aoFechar = () => fechar.current();
    el.addEventListener('close', aoFechar);
    return () => el.removeEventListener('close', aoFechar);
  }, []);

  const grupos = (['ANTIGO', 'NOVO'] as const)
    .map((t) => ({ t, livros: disponiveis.filter((l) => l.testamento === t) }))
    .filter((g) => g.livros.length > 0);
  const alternar = (codigo: string, marcado: boolean) =>
    setMarcados((atual) => {
      const novo = new Set<string>(atual);
      if (marcado) novo.add(codigo);
      else novo.delete(codigo);
      return novo;
    });

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={`${id}-titulo`}
      className="mx-auto mt-auto mb-0 flex max-h-[85dvh] w-full max-w-none flex-col rounded-t-xl bg-white p-0 font-sans shadow-2xl backdrop:bg-black/30 sm:m-auto sm:max-w-2xl sm:rounded-lg"
    >
      <h2 id={`${id}-titulo`} className="px-5 pt-4 pb-2 font-serif text-lg font-semibold">
        Buscar nos livros
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {grupos.map((g) => (
          <fieldset key={g.t} className="mb-4">
            <legend className="mb-2 text-sm font-medium">{NOME_TESTAMENTO[g.t]}</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {g.livros.map((l) => (
                <div key={l.codigo.valor} className="flex items-center gap-2">
                  <input
                    id={`${id}-${l.codigo.valor}`}
                    type="checkbox"
                    checked={marcados.has(l.codigo.valor)}
                    onChange={(e) => alternar(l.codigo.valor, e.target.checked)}
                  />
                  <label htmlFor={`${id}-${l.codigo.valor}`}>{l.nome}</label>
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <button
          type="button"
          onClick={() => setMarcados(new Set())}
          className="mr-auto rounded-md px-3 py-2 text-sm hover:bg-stone-100"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="rounded-md px-3 py-2 text-sm hover:bg-stone-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() =>
            onAplicar(disponiveis.map((l) => l.codigo.valor).filter((c) => marcados.has(c)))
          }
          className="bg-primaria text-sobre-tinta rounded-md px-4 py-2 text-sm font-medium"
        >
          Aplicar
        </button>
      </div>
    </dialog>
  );
}
