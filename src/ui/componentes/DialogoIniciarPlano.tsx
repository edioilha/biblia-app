import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CodigoLivro } from '../../dominio/biblia';
import { DataLocal, type PlanoLeitura } from '../../dominio/planos';
import { useDependencias } from '../contexto/Dependencias';
import { descreverLeitura } from './leituraDoDia';

interface Props {
  plano: PlanoLeitura;
  hoje: DataLocal;
  ocupado: boolean;
  erro?: string | null | undefined;
  onIniciar: (inicio: DataLocal, diaInicial: number) => void;
  onFechar: () => void;
}

type Partida = 'inicio' | 'calendario' | 'livro';

/**
 * UC07 — escolhe a data de início (padrão: hoje) e por onde começar (A5): do início do
 * plano (padrão), pela leitura do calendário (planos de 365 dias) ou por um livro. Mostra a
 * primeira leitura de cada opção. `<dialog>` modal (foco preso e Esc nativos), montado só
 * enquanto aberto.
 */
export function DialogoIniciarPlano({ plano, hoje, ocupado, erro, onIniciar, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const id = useId();
  const { canon } = useDependencias();
  const [inicio, setInicio] = useState(hoje.paraIso());
  const [partida, setPartida] = useState<Partida>('inicio');
  const livros = plano.livros();
  const [livro, setLivro] = useState<CodigoLivro | undefined>(livros[0]);
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
  const diaCalendario = plano.segueCalendario && data ? plano.diaDoCalendario(data) : null;
  const diaLivro = livro ? (plano.primeiroDiaCom(livro) ?? 1) : 1;
  const diaInicial =
    partida === 'calendario' ? (diaCalendario ?? 1) : partida === 'livro' ? diaLivro : 1;
  const leitura = (n: number) => descreverLeitura(plano.dia(n), canon);

  const iniciar = (e: FormEvent) => {
    e.preventDefault();
    if (data && !ocupado) onIniciar(data, diaInicial);
  };
  const opcao = (valor: Partida, rotulo: string, detalhe: string) => (
    <label className="flex items-baseline gap-2 text-sm">
      <input
        aria-label={rotulo}
        type="radio"
        name={`${id}-partida`}
        value={valor}
        checked={partida === valor}
        onChange={() => setPartida(valor)}
      />
      <span>
        <span className="font-medium">{rotulo}</span>
        <span className="block text-xs text-stone-600">{detalhe}</span>
      </span>
    </label>
  );

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

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Começar por</legend>
          {opcao('inicio', 'Início do plano', leitura(1))}
          {plano.segueCalendario &&
            opcao(
              'calendario',
              'Leitura do calendário',
              data && diaCalendario
                ? `${data.formatar().slice(0, 5)}: ${leitura(diaCalendario)}`
                : 'Escolha uma data válida.',
            )}
          <div className="flex flex-col gap-1.5">
            {opcao('livro', 'Um livro', leitura(diaLivro))}
            {partida === 'livro' && (
              <select
                aria-label="Livro"
                value={livro?.valor}
                onChange={(e) => setLivro(CodigoLivro.de(e.target.value))}
                className="focus-visible:outline-primaria ml-6 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-2"
              >
                {livros.map((l) => (
                  <option key={l.valor} value={l.valor}>
                    {canon.livro(l).nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </fieldset>

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
            className="bg-primaria text-sobre-tinta rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Iniciar plano
          </button>
        </div>
      </form>
    </dialog>
  );
}
