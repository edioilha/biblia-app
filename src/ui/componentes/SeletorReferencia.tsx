import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Referencia, Testamento, type Livro } from '../../dominio/biblia';
import { normalizarChave } from '../../dominio/compartilhado/texto';
import { useDependencias } from '../contexto/Dependencias';
import { caminhoLeitura } from '../rotas';

interface Props {
  atual: Referencia;
}

/**
 * UC01 (A1) e UC02 — seletor de livro/capítulo com campo único que aceita
 * referência digitada ("jo 3:16") e filtra os livros.
 */
export function SeletorReferencia({ atual }: Props) {
  const { canon } = useDependencias();
  const navigate = useNavigate();
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idErro = useId();

  const livroAtual = canon.livro(atual.livro);
  const [entrada, setEntrada] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [livroEscolhido, setLivroEscolhido] = useState<Livro>(livroAtual);

  const filtro = normalizarChave(entrada.replace(/\d+\s*([:.,]\s*\d*)?\s*$/u, ''));
  const filtrados = useMemo(
    () =>
      canon
        .livros()
        .filter(
          (l) =>
            !filtro ||
            normalizarChave(l.nome).startsWith(filtro) ||
            normalizarChave(l.abreviacao).startsWith(filtro),
        ),
    [canon, filtro],
  );

  function abrir() {
    setEntrada('');
    setErro(null);
    setLivroEscolhido(livroAtual);
    dialogo.current?.showModal();
  }

  function ir(ref: Referencia) {
    dialogo.current?.close();
    void navigate(caminhoLeitura(ref));
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    try {
      ir(Referencia.parse(entrada, canon));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : String(falha));
    }
  }

  const grupos = [
    {
      titulo: 'Antigo Testamento',
      livros: filtrados.filter((l) => l.testamento === Testamento.ANTIGO),
    },
    {
      titulo: 'Novo Testamento',
      livros: filtrados.filter((l) => l.testamento === Testamento.NOVO),
    },
  ].filter((g) => g.livros.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className="border-papel-borda hover:border-tinta-suave rounded-md border bg-white px-3 py-1.5 text-sm"
      >
        {atual.doCapitulo().formatar(livroAtual)} <span aria-hidden="true">▾</span>
        <span className="sr-only"> — escolher livro e capítulo</span>
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        className="seletor m-auto max-h-dvh w-full max-w-4xl rounded-none bg-white p-0 shadow-2xl backdrop:bg-black/30 sm:max-h-[85dvh] sm:rounded-lg"
      >
        <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <h2 id={idTitulo} className="font-semibold">
            Escolher livro e capítulo
          </h2>
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="rounded px-2 py-1 text-xl leading-none text-stone-500 hover:bg-stone-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={aoEnviar} className="px-4 pt-4">
          <label htmlFor={`${idTitulo}-entrada`} className="sr-only">
            Livro ou referência
          </label>
          <input
            id={`${idTitulo}-entrada`}
            type="search"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- foco esperado ao abrir o seletor
            autoFocus
            autoComplete="off"
            enterKeyHint="go"
            value={entrada}
            onChange={(e) => {
              setEntrada(e.target.value);
              setErro(null);
            }}
            placeholder="Livro ou referência (ex.: jo 3:16)"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? idErro : undefined}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
          <p id={idErro} role="alert" className="mt-1 min-h-5 text-sm text-red-700">
            {erro}
          </p>
        </form>

        <div className="grid gap-6 px-4 pb-6 md:grid-cols-[3fr_2fr]">
          <div>
            {grupos.length === 0 && (
              <p className="text-sm text-stone-500">Nenhum livro corresponde a “{entrada}”.</p>
            )}
            {grupos.map((g) => (
              <section key={g.titulo} aria-label={g.titulo} className="mb-4">
                <h3 className="mb-2 text-xs tracking-widest text-stone-500 uppercase">
                  {g.titulo}
                </h3>
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5">
                  {g.livros.map((l) => (
                    <li key={l.codigo.valor}>
                      <button
                        type="button"
                        title={l.nome}
                        aria-label={l.nome}
                        aria-pressed={l === livroEscolhido}
                        onClick={() => setLivroEscolhido(l)}
                        className="aria-pressed:text-sobre-tinta w-full rounded border border-stone-300 py-1.5 text-sm hover:bg-stone-100 aria-pressed:border-stone-900 aria-pressed:bg-stone-900"
                      >
                        {l.abreviacao}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section aria-label={`Capítulos de ${livroEscolhido.nome}`}>
            <h3 className="mb-2 text-xs tracking-widest text-stone-500 uppercase">
              {livroEscolhido.nome} · {livroEscolhido.totalCapitulos}{' '}
              {livroEscolhido.totalCapitulos === 1 ? 'capítulo' : 'capítulos'}
            </h3>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
              {Array.from({ length: livroEscolhido.totalCapitulos }, (_, i) => i + 1).map((n) => {
                const ehAtual = livroEscolhido === livroAtual && n === atual.capitulo;
                return (
                  <li key={n}>
                    <button
                      type="button"
                      aria-label={`${livroEscolhido.nome} ${n}`}
                      aria-current={ehAtual ? 'page' : undefined}
                      onClick={() => ir(Referencia.capitulo(livroEscolhido, n))}
                      className="aria-[current=page]:text-sobre-tinta w-full rounded border border-stone-300 py-1.5 text-sm hover:bg-stone-100 aria-[current=page]:border-stone-900 aria-[current=page]:bg-stone-900"
                    >
                      {n}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </dialog>
    </>
  );
}
