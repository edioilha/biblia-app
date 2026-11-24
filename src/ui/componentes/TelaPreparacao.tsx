import type { ProgressoPreparacao } from '../../aplicacao/casos-de-uso';

interface Props {
  progresso: ProgressoPreparacao | null;
  erro: Error | null;
  aoTentarNovamente?: () => void;
}

/** Primeira execução: importação da versão embarcada para o IndexedDB. */
export function TelaPreparacao({ progresso, erro, aoTentarNovamente }: Props) {
  const pct = progresso ? Math.round((progresso.concluidos / progresso.total) * 100) : 0;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <section
        aria-labelledby="titulo-preparacao"
        className="pagina-papel border-papel-borda w-full max-w-md rounded-sm border px-8 py-10 text-center font-serif shadow-xl"
      >
        <h1 id="titulo-preparacao" className="text-2xl">
          {erro ? 'Não foi possível preparar a Bíblia' : 'Preparando a Bíblia…'}
        </h1>
        {erro ? (
          <>
            <p className="text-tinta-suave mt-4 font-sans text-sm">{erro.message}</p>
            <button
              type="button"
              onClick={aoTentarNovamente}
              className="bg-primaria text-sobre-tinta mt-6 rounded px-4 py-2 font-sans text-sm"
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <p className="text-tinta-suave mt-2 font-sans text-sm">
              Só na primeira vez — depois tudo funciona offline.
            </p>
            <div
              role="progressbar"
              aria-label="Progresso da preparação"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="bg-papel-borda mt-6 h-2 overflow-hidden rounded-full"
            >
              <div className="bg-primaria h-full transition-[width]" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-tinta-suave mt-2 font-sans text-xs" aria-hidden="true">
              {pct}%
            </p>
          </>
        )}
      </section>
    </main>
  );
}
