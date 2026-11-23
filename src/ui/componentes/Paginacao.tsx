import { paginasVisiveis } from '../parametrosBusca';

const classeBotao =
  'focus-visible:outline-primaria flex min-w-9 items-center justify-center rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-40';

/** RF02.7 — paginação numérica com primeira/última página e reticências. */
export function Paginacao({
  atual,
  total,
  onIr,
  rotulo = 'Páginas de resultados',
}: {
  atual: number;
  total: number;
  onIr: (pagina: number) => void;
  rotulo?: string;
}) {
  if (total <= 1) return null;
  return (
    <nav aria-label={rotulo} className="mt-6 flex justify-center">
      <ul className="flex flex-wrap items-center gap-1.5 font-sans">
        <li>
          <button
            type="button"
            className={classeBotao}
            disabled={atual <= 1}
            onClick={() => onIr(atual - 1)}
            aria-label="Página anterior"
          >
            ‹
          </button>
        </li>
        {paginasVisiveis(atual, total).map((n, i) =>
          n === '…' ? (
            <li key={`r${i}`} aria-hidden="true" className="px-1 text-stone-500">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className={`${classeBotao} ${n === atual ? 'bg-tinta! border-tinta text-white' : ''}`}
                aria-current={n === atual ? 'page' : undefined}
                aria-label={`Página ${n}`}
                onClick={() => onIr(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={classeBotao}
            disabled={atual >= total}
            onClick={() => onIr(atual + 1)}
            aria-label="Próxima página"
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
