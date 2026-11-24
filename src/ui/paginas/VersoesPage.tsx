import { useEffect, useRef, useState } from 'react';
import type { ItemVersao, ProgressoInstalacao } from '../../aplicacao/casos-de-uso';
import type { Versao } from '../../dominio/biblia';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { DialogoConfirmacao } from '../componentes/DialogoConfirmacao';
import { useInstalacoes, type EstadoInstalacao } from '../contexto/Instalacoes';
import { useEditarVersoes, useListaVersoes } from '../hooks/useVersoes';

const classeBotao =
  'focus-visible:outline-primaria rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-50';
const classeBotaoPrimario =
  'bg-tinta rounded-md px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria disabled:opacity-50';

const formatarMb = (bytes: number) =>
  `${(bytes / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
const formatarGb = (bytes: number) =>
  `${(bytes / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`;

/** UC09/UC10 — Versões: instaladas (escolher a ativa, remover) e disponíveis para instalar. */
export function VersoesPage() {
  const lista = useListaVersoes();
  const editar = useEditarVersoes();
  const { estados, aviso: avisoInstalacao } = useInstalacoes();
  const [remover, setRemover] = useState<Versao | null>(null);
  const [erroRemover, setErroRemover] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Versões · Bíblia App';
  }, []);

  const itens = lista.data ?? [];
  const instaladas = itens.filter((i) => i.instalada);
  const disponiveis = itens.filter((i) => !i.instalada);

  const trocar = (versao: Versao) =>
    editar.mutate(
      { tipo: 'trocar', versao: versao.id },
      {
        onSuccess: () => setAviso(`Lendo na ${versao.nome}.`),
        onError: () => setAviso('Não foi possível trocar a versão.'),
      },
    );

  const confirmarRemocao = (versao: Versao) =>
    editar.mutate(
      { tipo: 'remover', versao: versao.id },
      {
        onSuccess: () => {
          setRemover(null);
          setErroRemover(null);
          setAviso(`${versao.nome} removida.`);
          setTimeout(() => titulo.current?.focus(), 0);
        },
        onError: () => setErroRemover('Não foi possível remover a versão.'),
      },
    );

  return (
    <>
      <BarraSuperior />
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans sm:py-8">
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
          Versões
        </h1>
        <p aria-live="polite" className="sr-only">
          {aviso}
        </p>
        {/* Instalações: anúncio próprio, também ao concluir depois de sair e voltar. */}
        <p aria-live="polite" className="sr-only">
          {avisoInstalacao}
        </p>

        {lista.isError && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível carregar as versões.
          </p>
        )}
        {lista.isPending && <p className="mt-4 text-sm text-stone-600">Carregando…</p>}

        {lista.data && (
          <>
            <fieldset className="mt-6">
              <legend className="text-xs font-medium tracking-wide text-stone-600 uppercase">
                Instaladas · escolha a versão de leitura
              </legend>
              <ul className="mt-3 flex flex-col gap-3">
                {instaladas.map((item) => (
                  <VersaoInstalada
                    key={item.versao.id}
                    item={item}
                    ocupado={editar.isPending}
                    onTrocar={() => trocar(item.versao)}
                    onRemover={() => {
                      setErroRemover(null);
                      setRemover(item.versao);
                    }}
                  />
                ))}
              </ul>
            </fieldset>

            {disponiveis.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-medium tracking-wide text-stone-600 uppercase">
                  Disponíveis para instalar
                </h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {disponiveis.map((item) => (
                    <VersaoDisponivel
                      key={item.versao.id}
                      versao={item.versao}
                      estado={estados.get(item.versao.id) ?? null}
                    />
                  ))}
                </ul>
              </div>
            )}

            <RodapeVersoes instaladas={instaladas.length} />
          </>
        )}
      </main>

      {remover && (
        <DialogoConfirmacao
          titulo={`Remover ${remover.nome}?`}
          mensagem={
            'O texto sai deste aparelho. Favoritos e anotações continuam; os destaques feitos ' +
            'nesta versão voltam se você a instalar de novo.'
          }
          confirmar="Remover versão"
          ocupado={editar.isPending}
          erro={erroRemover}
          onConfirmar={() => confirmarRemocao(remover)}
          onFechar={() => setRemover(null)}
        />
      )}
    </>
  );
}

function descricao(versao: Versao, extra?: string): string {
  return [versao.ano, versao.licenca, versao.observacao, extra].filter(Boolean).join(' · ');
}

function VersaoInstalada({
  item: { versao, ativa },
  ocupado,
  onTrocar,
  onRemover,
}: {
  item: ItemVersao;
  ocupado: boolean;
  onTrocar: () => void;
  onRemover: () => void;
}) {
  const id = `versao-${versao.id}`;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-stone-300 bg-white p-4">
      <input
        id={id}
        type="radio"
        name="versao-ativa"
        checked={ativa}
        disabled={ocupado}
        onChange={onTrocar}
        aria-describedby={`${id}-detalhes`}
        className="accent-tinta size-4 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 font-semibold">
          <span>
            {versao.sigla} · {versao.nome}
          </span>
          {versao.padrao && (
            <span className="rounded-full border border-stone-300 px-2 py-0.5 text-xs font-normal">
              Padrão
            </span>
          )}
          {ativa && (
            <span className="bg-tinta rounded-full px-2 py-0.5 text-xs font-normal text-white">
              Ativa
            </span>
          )}
        </label>
        <p id={`${id}-detalhes`} className="text-xs text-stone-600">
          {descricao(versao, versao.padrao ? 'vem com o app' : undefined)}
        </p>
      </div>
      {versao.removivel && (
        <button
          type="button"
          disabled={ocupado}
          onClick={onRemover}
          aria-label={`Remover ${versao.nome}`}
          className={classeBotao}
        >
          Remover
        </button>
      )}
    </li>
  );
}

const ETAPAS: Record<ProgressoInstalacao['etapa'], [numero: number, rotulo: string]> = {
  BAIXANDO: [1, 'Baixando'],
  IMPORTANDO: [2, 'Importando'],
  INDEXANDO: [3, 'Preparando a busca'],
};

function VersaoDisponivel({ versao, estado }: { versao: Versao; estado: EstadoInstalacao | null }) {
  const { instalar, cancelar } = useInstalacoes();
  const tamanho = versao.tamanhoMb ? `download de ~${versao.tamanhoMb} MB` : undefined;
  return (
    <li className="rounded-xl border border-stone-300 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {versao.sigla} · {versao.nome}
          </p>
          <p className="text-xs text-stone-600">{descricao(versao, tamanho)}</p>
        </div>
        {estado?.tipo === 'andamento' ? (
          <button
            type="button"
            onClick={() => cancelar(versao.id)}
            aria-label={`Cancelar instalação de ${versao.nome}`}
            className={classeBotao}
          >
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => instalar(versao)}
            aria-label={`${estado ? 'Tentar instalar de novo' : 'Instalar'} ${versao.nome}`}
            className={classeBotaoPrimario}
          >
            {estado ? 'Tentar novamente' : '⇩ Instalar'}
          </button>
        )}
      </div>
      {estado?.tipo === 'andamento' && (
        <Progresso nome={versao.nome} progresso={estado.progresso} />
      )}
      {estado?.tipo === 'erro' && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {estado.mensagem}
        </p>
      )}
    </li>
  );
}

/** UC09 passo 3: 3 etapas; o download (a mais longa) tem porcentagem. */
function Progresso({ nome, progresso }: { nome: string; progresso: ProgressoInstalacao | null }) {
  const [numero, rotulo] = ETAPAS[progresso?.etapa ?? 'BAIXANDO'];
  const baixando = !progresso || progresso.etapa === 'BAIXANDO';
  const percentual = progresso ? Math.round((progresso.concluidos / progresso.total) * 100) : 0;
  const texto = baixando
    ? `${rotulo}… ${progresso?.concluidos ?? 0} de ${progresso?.total ?? 66} livros`
    : `${rotulo}…`;
  return (
    <div className="mt-3 flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={`Instalação de ${nome}`}
        aria-valuetext={`Etapa ${numero} de 3: ${texto}`}
        {...(baixando
          ? { 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': percentual }
          : {})}
        className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className={`bg-tinta h-full ${baixando ? '' : 'animate-pulse'}`}
          style={{ width: baixando ? `${percentual}%` : '100%' }}
        />
      </div>
      <span className="shrink-0 text-xs text-stone-600 tabular-nums">
        {texto} ({numero}/3)
      </span>
    </div>
  );
}

/** Nota 4 do wireframe: aviso legal e uso do armazenamento local (RNF10, RNF01). */
function RodapeVersoes({ instaladas }: { instaladas: number }) {
  const [uso, setUso] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    navigator.storage
      ?.estimate?.()
      .then(({ usage, quota }) => {
        if (ativo && usage !== undefined && quota !== undefined) {
          setUso(`Armazenamento usado: ${formatarMb(usage)} de ~${formatarGb(quota)} disponíveis.`);
        }
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [instaladas]);

  return (
    <p className="mt-8 rounded-lg border border-dashed border-stone-300 p-4 text-xs text-stone-600">
      Apenas traduções em domínio público são distribuídas. Fonte:{' '}
      <a
        href="https://github.com/Projeto-Euaggelion/biblia.data"
        className="text-primaria underline"
        target="_blank"
        rel="noreferrer"
      >
        Projeto-Euaggelion/biblia.data
      </a>
      . Depois de instalada, a versão funciona sem internet.{uso && ` ${uso}`}
    </p>
  );
}
