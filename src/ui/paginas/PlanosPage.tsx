import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { PlanoSeguido } from '../../aplicacao/casos-de-uso';
import type { DataLocal, DiaPlano, PlanoLeitura } from '../../dominio/planos';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { DialogoConfirmacao } from '../componentes/DialogoConfirmacao';
import { DialogoIniciarPlano } from '../componentes/DialogoIniciarPlano';
import { descreverLeitura } from '../componentes/leituraDoDia';
import { MenuAcoes, type AcaoMenu } from '../componentes/MenuAcoes';
import { useDependencias } from '../contexto/Dependencias';
import { useEditarPlanos, usePainelPlanos, type AcaoPlano } from '../hooks/usePlanos';
import { caminhoLeitura } from '../rotas';

/** Dias em atraso listados por extenso; os demais aparecem só no total. */
const ATRASADOS_VISIVEIS = 7;
/** Linha do tempo: últimos dias até hoje (wireframe docs/05 §4, nota 4). */
const DIAS_NA_LINHA = 14;

type Dialogo =
  | { tipo: 'iniciar'; plano: PlanoLeitura }
  | { tipo: 'reagendar' | 'encerrar'; seguido: PlanoSeguido };

const classeBotao =
  'focus-visible:outline-primaria rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-50';
const classeBotaoPrimario =
  'bg-tinta rounded-md px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria';

/** UC07/UC08 — Planos de leitura: planos seguidos, leitura do dia, atrasos e catálogo. */
export function PlanosPage() {
  const painel = usePainelPlanos();
  const editar = useEditarPlanos();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);

  const executar = (acao: AcaoPlano, mensagem: string) =>
    editar.mutate(acao, {
      onSuccess: () => {
        setDialogo(null);
        setErro(null);
        setAviso(mensagem);
      },
      onError: (e) => {
        const texto = `Não foi possível salvar. ${e instanceof Error ? e.message : ''}`.trim();
        if (dialogo) setErro(texto);
        else setAviso(texto);
      },
    });
  const fecharDialogo = () => {
    setDialogo(null);
    setErro(null);
    setTimeout(() => titulo.current?.focus(), 0);
  };

  const dados = painel.data;
  return (
    <>
      <BarraSuperior />
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans sm:py-8">
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
          Planos de leitura
        </h1>
        <p aria-live="polite" className="sr-only">
          {aviso}
        </p>

        {painel.isError && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível carregar os planos.
          </p>
        )}
        {!dados && !painel.isError && <p className="mt-4 text-sm text-stone-600">Carregando…</p>}

        {dados && (
          <>
            <div className="mt-4 flex flex-col gap-6">
              {dados.seguidos.map((s) => (
                <CartaoPlano
                  key={s.inscricao.id}
                  seguido={s}
                  hoje={dados.hoje}
                  ocupado={editar.isPending}
                  onAcao={executar}
                  onDialogo={setDialogo}
                />
              ))}
            </div>

            {dados.disponiveis.length > 0 && (
              <section aria-labelledby="titulo-catalogo" className="mt-8">
                <h2
                  id="titulo-catalogo"
                  className="text-xs font-medium tracking-wide text-stone-600 uppercase"
                >
                  {dados.seguidos.length ? 'Outros planos' : 'Escolha um plano para começar'}
                </h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                  {dados.disponiveis.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-1 rounded-lg border border-stone-300 bg-white p-4"
                    >
                      <h3 className="font-semibold">{p.nome}</h3>
                      <p className="text-sm text-stone-600">{p.descricao}</p>
                      <p className="text-xs text-stone-500">
                        ~{p.capitulosPorDia} capítulos por dia
                      </p>
                      <button
                        type="button"
                        onClick={() => setDialogo({ tipo: 'iniciar', plano: p })}
                        aria-label={`Iniciar ${p.nome}`}
                        className={`${classeBotao} mt-2 self-start`}
                      >
                        Iniciar
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {dialogo?.tipo === 'iniciar' && dados && (
        <DialogoIniciarPlano
          plano={dialogo.plano}
          hoje={dados.hoje}
          ocupado={editar.isPending}
          erro={erro}
          onIniciar={(inicio) =>
            executar(
              { tipo: 'iniciar', plano: dialogo.plano.id, inicio },
              `Plano “${dialogo.plano.nome}” iniciado.`,
            )
          }
          onFechar={fecharDialogo}
        />
      )}
      {dialogo?.tipo === 'reagendar' && dados && (
        <DialogoConfirmacao
          {...textoReagendar(dialogo.seguido, dados.hoje)}
          perigosa={false}
          ocupado={editar.isPending}
          erro={erro}
          onConfirmar={() =>
            executar(
              { tipo: 'reagendar', inscricao: dialogo.seguido.inscricao },
              `Plano “${dialogo.seguido.plano.nome}” reagendado.`,
            )
          }
          onFechar={fecharDialogo}
        />
      )}
      {dialogo?.tipo === 'encerrar' && (
        <DialogoConfirmacao
          titulo="Encerrar plano?"
          mensagem={`Você deixa de seguir “${dialogo.seguido.plano.nome}” e o progresso é apagado.`}
          confirmar="Encerrar plano"
          ocupado={editar.isPending}
          erro={erro}
          onConfirmar={() =>
            executar(
              { tipo: 'encerrar', inscricao: dialogo.seguido.inscricao },
              `Plano “${dialogo.seguido.plano.nome}” encerrado.`,
            )
          }
          onFechar={fecharDialogo}
        />
      )}
    </>
  );
}

function textoReagendar({ inscricao, plano }: PlanoSeguido, hoje: DataLocal) {
  const pendente = inscricao.primeiroPendente() ?? 1;
  const termino = inscricao.reagendar(hoje).dataDoDia(plano.duracaoDias);
  return {
    titulo: 'Reagendar plano?',
    mensagem: `O dia ${pendente} passa a ser a leitura de hoje e o plano termina em ${termino.formatar()}. Os dias já concluídos continuam concluídos.`,
    confirmar: 'Reagendar',
  };
}

function CartaoPlano({
  seguido,
  hoje,
  ocupado,
  onAcao,
  onDialogo,
}: {
  seguido: PlanoSeguido;
  hoje: DataLocal;
  ocupado: boolean;
  onAcao: (acao: AcaoPlano, mensagem: string) => void;
  onDialogo: (d: Dialogo) => void;
}) {
  const { canon } = useDependencias();
  const { inscricao, plano } = seguido;
  const id = useId();
  const progresso = inscricao.progresso();
  const diaHoje = inscricao.diaDe(hoje);
  const atrasados = inscricao.diasAtrasados(hoje);
  const concluido = inscricao.status === 'CONCLUIDO';
  const marcar = (dia: number, feito: boolean) =>
    onAcao(
      { tipo: 'marcar', inscricao, dia, concluido: feito },
      feito ? `Dia ${dia} concluído.` : `Dia ${dia} desmarcado.`,
    );

  const acoes: AcaoMenu[] = [
    ...(atrasados.length && !concluido
      ? [
          {
            rotulo: 'Reagendar plano',
            onSelecionar: () => onDialogo({ tipo: 'reagendar', seguido }),
          },
        ]
      : []),
    {
      rotulo: 'Encerrar plano',
      perigosa: true,
      onSelecionar: () => onDialogo({ tipo: 'encerrar', seguido }),
    },
  ];

  const situacao = concluido
    ? 'Plano concluído'
    : diaHoje === null
      ? `começa em ${inscricao.inicio.formatar()}`
      : `hoje é o dia ${diaHoje}`;

  return (
    <section
      aria-labelledby={`${id}-nome`}
      className="rounded-xl border border-stone-300 bg-white p-4 sm:p-5"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-nome`} className="text-lg font-semibold">
            {plano.nome}
          </h2>
          <p className="text-xs text-stone-500">
            {diaHoje === null ? 'início em' : 'iniciado em'} {inscricao.inicio.formatar()}
          </p>
        </div>
        <MenuAcoes rotulo={`Ações de ${plano.nome}`} acoes={acoes} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={`Progresso de ${plano.nome}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progresso.percentual}
          className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200"
        >
          <div className="bg-tinta h-full" style={{ width: `${progresso.percentual}%` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums">{progresso.percentual}%</span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {progresso.concluidos} de {progresso.total} dias concluídos · {situacao}
      </p>

      {concluido ? (
        <div className="mt-4 rounded-lg bg-stone-100 p-4 text-sm">
          <p>Parabéns! Você concluiu todos os {plano.duracaoDias} dias.</p>
          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              onAcao(
                { tipo: 'iniciar', plano: plano.id, inicio: hoje },
                `Plano “${plano.nome}” recomeçado.`,
              )
            }
            className={`${classeBotao} mt-3`}
          >
            Começar de novo
          </button>
        </div>
      ) : (
        <>
          <div className={`mt-4 grid gap-3 ${atrasados.length ? 'sm:grid-cols-2' : ''}`}>
            <LeituraDoDia
              titulo={
                diaHoje === null
                  ? `Primeira leitura · dia 1 · ${inscricao.inicio.formatar()}`
                  : `Leitura de hoje · dia ${diaHoje}`
              }
              dia={plano.dia(diaHoje ?? 1)}
              feito={inscricao.concluido(diaHoje ?? 1)}
              podeConcluir={diaHoje !== null}
              ocupado={ocupado}
              onMarcar={marcar}
            />

            {atrasados.length > 0 && (
              <div className="rounded-lg border border-dashed border-stone-300 p-4">
                <h3 className="text-xs font-medium tracking-wide text-stone-600 uppercase">
                  Em atraso · {atrasados.length} {atrasados.length === 1 ? 'dia' : 'dias'}
                </h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {atrasados.slice(0, ATRASADOS_VISIVEIS).map((n) => (
                    <li key={n}>
                      <label className="flex items-baseline gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={ocupado}
                          onChange={() => marcar(n, true)}
                        />
                        <span>
                          Dia {n} · {descreverLeitura(plano.dia(n), canon)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                {atrasados.length > ATRASADOS_VISIVEIS && (
                  <p className="mt-1.5 text-xs text-stone-500">
                    e mais {atrasados.length - ATRASADOS_VISIVEIS} dias
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onDialogo({ tipo: 'reagendar', seguido })}
                  className={`${classeBotao} mt-3`}
                >
                  ↻ Reagendar plano
                </button>
              </div>
            )}
          </div>

          {/* No primeiro dia a linha do tempo teria um ponto só: não ajuda. */}
          {diaHoje !== null && diaHoje > 1 && <LinhaDoTempo seguido={seguido} hoje={diaHoje} />}
        </>
      )}
    </section>
  );
}

function LeituraDoDia({
  titulo,
  dia,
  feito,
  podeConcluir,
  ocupado,
  onMarcar,
}: {
  titulo: string;
  dia: DiaPlano;
  feito: boolean;
  podeConcluir: boolean;
  ocupado: boolean;
  onMarcar: (dia: number, feito: boolean) => void;
}) {
  const { canon } = useDependencias();
  const primeiro = dia.capitulos[0];
  return (
    <div className="rounded-lg border border-dashed border-stone-300 p-4">
      <h3 className="text-xs font-medium tracking-wide text-stone-600 uppercase">{titulo}</h3>
      <p className="mt-1 font-serif text-xl">{descreverLeitura(dia, canon)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {primeiro && (
          <Link to={caminhoLeitura(primeiro)} className={classeBotaoPrimario}>
            Ler agora
          </Link>
        )}
        {podeConcluir &&
          (feito ? (
            <>
              <span className="text-sm font-medium text-green-800">✓ Concluído</span>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => onMarcar(dia.numero, false)}
                className="text-primaria rounded-sm text-sm hover:underline disabled:opacity-50"
              >
                Desfazer
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onMarcar(dia.numero, true)}
              className={classeBotao}
            >
              ✓ Concluir
            </button>
          ))}
      </div>
    </div>
  );
}

/** Últimos dias até hoje: preenchido = concluído; contorno forte = hoje. */
function LinhaDoTempo({ seguido, hoje }: { seguido: PlanoSeguido; hoje: number }) {
  const { inscricao } = seguido;
  const inicio = Math.max(1, hoje - DIAS_NA_LINHA + 1);
  const dias = Array.from({ length: hoje - inicio + 1 }, (_, i) => inicio + i);
  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium tracking-wide text-stone-600 uppercase">
        Últimos {dias.length} dias
      </h3>
      <ol className="mt-2 flex flex-wrap gap-1.5">
        {dias.map((n) => {
          const feito = inscricao.concluido(n);
          const estado = `${feito ? 'concluído' : 'pendente'}${n === hoje ? ', hoje' : ''}`;
          return (
            <li
              key={n}
              title={`Dia ${n}: ${estado}`}
              className={[
                'flex h-8 min-w-10 items-center justify-center rounded-full border px-2 text-sm tabular-nums',
                feito ? 'bg-tinta border-tinta text-white' : 'border-stone-300 bg-white',
                n === hoje ? 'border-tinta border-2' : '',
              ].join(' ')}
            >
              {n}
              <span className="sr-only">: {estado}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
