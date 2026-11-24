import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Testamento } from '../../dominio/biblia';
import { ModoBusca, Ordenacao, TAMANHOS_PAGINA, type ResultadoBusca } from '../../dominio/busca';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { Chip } from '../componentes/Chip';
import { Paginacao } from '../componentes/Paginacao';
import { SeletorLivros } from '../componentes/SeletorLivros';
import { TextoComOcorrencias } from '../componentes/TextoComOcorrencias';
import { useDependencias } from '../contexto/Dependencias';
import { useBuscaTexto, usePreparoBusca } from '../hooks/useBusca';
import {
  consultaDoEstado,
  estadoDaUrl,
  livrosDoEstado,
  livrosDoTestamento,
  parametrosDoEstado,
  type EstadoBusca,
} from '../parametrosBusca';
import { caminhoEstudos } from '../parametrosEstudos';
import { caminhoLeitura } from '../rotas';

/** RF02.6 — espera após a última tecla antes de buscar. */
const DEBOUNCE_MS = 250;

const ROTULO_MODO: Record<ModoBusca, string> = {
  TODAS_PALAVRAS: 'Todas as palavras',
  QUALQUER_PALAVRA: 'Qualquer palavra',
  FRASE_EXATA: 'Frase exata “ ”',
};

/** UC03 — Buscar texto: busca dinâmica, modos, filtros e resultados paginados. */
export function BuscaPage() {
  const { canon } = useDependencias();
  const [params, setParams] = useSearchParams();
  const estado = estadoDaUrl(params, canon);
  const parametros = parametrosDoEstado(estado).toString();
  const consulta = consultaDoEstado(estado, canon);

  const preparo = usePreparoBusca();
  const busca = useBuscaTexto(consulta, parametros);
  const pagina = consulta.pesquisavel ? busca.data : undefined;

  // O campo responde na hora; a URL (e a busca) só depois do debounce.
  const [texto, setTexto] = useState(estado.q);
  // Termo que a própria página pôs na URL. Se a URL muda por fora (voltar/avançar, link
  // "Buscar"), o campo acompanha — senão o debounce regravaria o termo antigo.
  const [qConhecido, setQConhecido] = useState(estado.q);
  if (estado.q !== qConhecido) {
    setQConhecido(estado.q);
    setTexto(estado.q);
  }
  const atualizar = (mudancas: Partial<EstadoBusca>, { manterPagina = false } = {}) => {
    const novo = { ...estado, ...(manterPagina ? {} : { pagina: 1 }), ...mudancas };
    setQConhecido(novo.q);
    setParams(parametrosDoEstado(novo), { replace: true });
  };
  const atualizarRef = useRef(atualizar);
  useEffect(() => {
    atualizarRef.current = atualizar;
  });
  useEffect(() => {
    if (texto === estado.q) return;
    const id = setTimeout(() => atualizarRef.current({ q: texto }), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [texto, estado.q]);

  const mudarTermo = (q: string) => {
    setTexto(q);
    atualizar({ q });
  };

  // Ao trocar de página: volta ao topo e leva o foco ao início dos resultados.
  const tituloResultados = useRef<HTMLHeadingElement>(null);
  const irParaPagina = (n: number) => {
    atualizar({ pagina: n }, { manterPagina: true });
    window.scrollTo?.({ top: 0 });
    tituloResultados.current?.focus({ preventScroll: true });
  };

  const modoEfetivo = consulta.modo;
  const escolherModo = (modo: ModoBusca) => {
    // Aspas forçam a frase exata: ao escolher outro modo, elas saem do termo.
    const semAspas =
      modo !== 'FRASE_EXATA' && modoEfetivo === 'FRASE_EXATA' ? consulta.termo : null;
    if (semAspas !== null && semAspas !== estado.q) setTexto(semAspas);
    atualizar({ modo, ...(semAspas !== null ? { q: semAspas } : {}) });
  };
  const escolherTestamento = (testamento: Testamento | null) =>
    atualizar({ testamento, livros: livrosDoTestamento(estado.livros, testamento, canon) });

  const livrosDisponiveis = canon
    .livros()
    .filter((l) => estado.testamento === null || l.testamento === estado.testamento);
  const filtrado = estado.testamento !== null || estado.livros.length > 0;

  const status = (() => {
    if (!estado.q.trim()) return '';
    if (!consulta.pesquisavel) return 'Digite ao menos 2 letras ou números.';
    if (!pagina) return preparo.isPending ? 'Preparando a busca…' : 'Buscando…';
    if (pagina.total === 0) return `Nenhum versículo encontrado para “${consulta.termo}”.`;
    const plural = pagina.total === 1 ? 'versículo encontrado' : 'versículos encontrados';
    return `${pagina.total.toLocaleString('pt-BR')} ${plural} · página ${pagina.pagina} de ${pagina.totalPaginas()}`;
  })();

  return (
    <>
      <BarraSuperior />
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans sm:py-8">
        <h1 className="sr-only">Buscar na Bíblia</h1>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
          <label htmlFor="termo-busca" className="sr-only">
            Buscar na Bíblia
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-500"
            >
              ⌕
            </span>
            <input
              id="termo-busca"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') atualizar({ q: texto });
              }}
              placeholder='Palavras ou "frase exata"'
              autoComplete="off"
              enterKeyHint="search"
              aria-describedby="dica-busca"
              className="focus-visible:outline-primaria w-full rounded-lg border border-stone-300 bg-white py-2.5 pr-3 pl-9 font-serif text-lg focus-visible:outline-2"
            />
          </div>
          <p id="dica-busca" className="sr-only">
            Os resultados aparecem enquanto você digita. Acentos e maiúsculas são ignorados.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Combinar as palavras</legend>
              {ModoBusca.todos.map((m) => (
                <Chip
                  key={m}
                  tipo="radio"
                  nome="modo"
                  marcado={modoEfetivo === m}
                  onMudar={() => escolherModo(m)}
                >
                  {ROTULO_MODO[m]}
                </Chip>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Onde buscar</legend>
              <Chip
                tipo="radio"
                nome="testamento"
                marcado={estado.testamento === null}
                onMudar={() => escolherTestamento(null)}
              >
                Toda a Bíblia
              </Chip>
              <Chip
                tipo="radio"
                nome="testamento"
                marcado={estado.testamento === Testamento.ANTIGO}
                onMudar={() => escolherTestamento(Testamento.ANTIGO)}
              >
                <abbr title="Antigo Testamento" className="no-underline">
                  AT
                </abbr>
                <span className="sr-only"> (Antigo Testamento)</span>
              </Chip>
              <Chip
                tipo="radio"
                nome="testamento"
                marcado={estado.testamento === Testamento.NOVO}
                onMudar={() => escolherTestamento(Testamento.NOVO)}
              >
                <abbr title="Novo Testamento" className="no-underline">
                  NT
                </abbr>
                <span className="sr-only"> (Novo Testamento)</span>
              </Chip>
              <SeletorLivros
                disponiveis={livrosDisponiveis}
                selecionados={livrosDoEstado(estado, canon)}
                onAplicar={(livros) => atualizar({ livros })}
              />
            </fieldset>
            <Chip
              tipo="checkbox"
              nome="aproximada"
              marcado={estado.aproximada}
              onMudar={(aproximada) => atualizar({ aproximada })}
            >
              <span aria-hidden="true">≈ </span>Aproximada
            </Chip>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-3">
          <h2 ref={tituloResultados} tabIndex={-1} className="text-sm focus:outline-none">
            <span className="sr-only">Resultados. </span>
            <span role="status" className="text-stone-700">
              {status}
            </span>
          </h2>
          {pagina && pagina.total > 0 && (
            <div className="flex gap-2 text-sm">
              <label className="flex items-center gap-1.5">
                <span className="text-stone-600">Ordenar</span>
                <select
                  value={estado.ordem}
                  onChange={(e) => atualizar({ ordem: Ordenacao.de(e.target.value) })}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1.5"
                >
                  <option value="RELEVANCIA">Relevância</option>
                  <option value="CANONICA">Ordem bíblica</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-stone-600">Por página</span>
                <select
                  value={estado.tamanho}
                  onChange={(e) => atualizar({ tamanho: Number(e.target.value) })}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1.5"
                >
                  {TAMANHOS_PAGINA.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {busca.isError && consulta.pesquisavel && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível buscar. {busca.error instanceof Error ? busca.error.message : ''}
          </p>
        )}

        {!estado.q.trim() && <Dicas onExemplo={mudarTermo} />}

        {pagina && pagina.total === 0 && (
          <SemResultados
            fuzzy={estado.aproximada}
            frase={modoEfetivo === 'FRASE_EXATA'}
            filtrado={filtrado}
            onAproximada={() => atualizar({ aproximada: true })}
            onTodaBiblia={() => atualizar({ testamento: null, livros: [] })}
            onPalavras={() => escolherModo('TODAS_PALAVRAS')}
          />
        )}

        {pagina && pagina.itens.length > 0 && (
          <ol
            aria-label="Versículos encontrados"
            aria-busy={busca.isFetching}
            className={`divide-y divide-stone-200 ${busca.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {pagina.itens.map((r) => (
              <ItemResultado
                key={r.referencia.chave()}
                resultado={r}
                nome={r.referencia.formatar(canon.livro(r.referencia.livro))}
              />
            ))}
          </ol>
        )}

        {pagina && (
          <Paginacao atual={pagina.pagina} total={pagina.totalPaginas()} onIr={irParaPagina} />
        )}

        {consulta.pesquisavel && pagina && (
          <p className="mt-6 text-sm text-stone-600">
            <Link
              to={caminhoEstudos({ aba: 'ANOTACOES', q: consulta.termo })}
              className="text-primaria font-medium hover:underline"
            >
              Procurar “{consulta.termo}” nas minhas anotações
            </Link>
          </p>
        )}
      </main>
    </>
  );
}

function ItemResultado({ resultado, nome }: { resultado: ResultadoBusca; nome: string }) {
  return (
    <li>
      <Link
        to={caminhoLeitura(resultado.referencia)}
        className="group focus-visible:outline-primaria -mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-stone-50 focus-visible:outline-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{nome}</span>
          <span className="mt-0.5 block font-serif text-[1.05rem] leading-relaxed text-stone-800">
            <TextoComOcorrencias texto={resultado.texto} ocorrencias={resultado.ocorrencias} />
          </span>
        </span>
        <span aria-hidden="true" className="text-stone-400 group-hover:text-stone-600">
          ›
        </span>
      </Link>
    </li>
  );
}

function Dicas({ onExemplo }: { onExemplo: (q: string) => void }) {
  const exemplos = ['amor', '"luz do mundo"', 'coracao'];
  return (
    <div className="mt-6 text-sm text-stone-600">
      <p>Busque palavras em toda a Bíblia. Acentos e maiúsculas não importam.</p>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        Exemplos:
        {exemplos.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onExemplo(e)}
            className="text-primaria rounded-sm font-medium hover:underline"
          >
            {e}
          </button>
        ))}
      </p>
    </div>
  );
}

function SemResultados({
  fuzzy,
  frase,
  filtrado,
  onAproximada,
  onTodaBiblia,
  onPalavras,
}: {
  fuzzy: boolean;
  frase: boolean;
  filtrado: boolean;
  onAproximada: () => void;
  onTodaBiblia: () => void;
  onPalavras: () => void;
}) {
  const sugestoes = [
    !fuzzy && !frase && { rotulo: 'Buscar resultados aproximados', acao: onAproximada },
    filtrado && { rotulo: 'Buscar em toda a Bíblia', acao: onTodaBiblia },
    frase && { rotulo: 'Buscar as palavras em qualquer ordem', acao: onPalavras },
  ].filter((s) => s !== false);
  if (sugestoes.length === 0) {
    return (
      <p className="mt-6 text-sm text-stone-600">Confira a grafia ou tente outras palavras.</p>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {sugestoes.map((s) => (
        <button
          key={s.rotulo}
          type="button"
          onClick={s.acao}
          className="text-primaria focus-visible:outline-primaria rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50 focus-visible:outline-2"
        >
          {s.rotulo}
        </button>
      ))}
    </div>
  );
}
