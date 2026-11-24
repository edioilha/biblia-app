import type { LeituraDoCapitulo } from '../../aplicacao/casos-de-uso';
import { useDependencias } from '../contexto/Dependencias';
import { useEditarPlanos } from '../hooks/usePlanos';
import { descreverLeitura } from './leituraDoDia';

/**
 * UC08 passo 3–5 — faixa da leitura (wireframe docs/05 tela 1, nota 7): aparece quando o
 * capítulo aberto faz parte da leitura de hoje (ou de um dia atrasado) de um plano em
 * andamento, com o progresso e "Concluir dia".
 */
export function FaixaPlano({ leituras }: { leituras: readonly LeituraDoCapitulo[] }) {
  const { canon } = useDependencias();
  const editar = useEditarPlanos();
  if (leituras.length === 0) return null;

  return (
    <aside aria-label="Planos de leitura" className="border-b border-stone-300 bg-stone-50">
      <ul className="mx-auto flex max-w-5xl flex-col gap-1.5 px-4 py-2 font-sans text-sm">
        {leituras.map(({ inscricao, plano, dia, hoje }) => {
          const feito = inscricao.concluido(dia.numero);
          const atrasado = dia.numero !== inscricao.diaDe(hoje);
          const { percentual } = inscricao.progresso();
          const marcar = () =>
            editar.mutate({ tipo: 'marcar', inscricao, dia: dia.numero, concluido: !feito });
          return (
            <li key={inscricao.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{plano.nome}</span>
                <span className="text-stone-600">
                  {' '}
                  · Dia {dia.numero}
                  {atrasado ? ' (atrasado)' : ''} · {descreverLeitura(dia, canon)}
                </span>
              </span>
              <span className="flex items-center gap-2 max-sm:hidden" aria-hidden="true">
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-200">
                  <span className="bg-tinta block h-full" style={{ width: `${percentual}%` }} />
                </span>
                <span className="text-xs text-stone-600 tabular-nums">{percentual}%</span>
              </span>
              <button
                type="button"
                disabled={editar.isPending}
                aria-pressed={feito}
                onClick={marcar}
                className={`focus-visible:outline-primaria rounded-md border px-3 py-1 focus-visible:outline-2 disabled:opacity-50 ${feito ? 'border-green-700 bg-green-50 text-green-900' : 'border-stone-300 bg-white hover:bg-stone-100'}`}
              >
                {feito ? `✓ Dia ${dia.numero} concluído` : `Concluir dia ${dia.numero}`}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
