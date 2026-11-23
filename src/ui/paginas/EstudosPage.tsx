import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Testamento, type Canon } from '../../dominio/biblia';
import {
  AbaEstudos,
  CorDestaque,
  OrdemEstudos,
  referenciaDaMarcacao,
  type Anotacao,
  type ItemEstudo,
} from '../../dominio/estudo';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { DialogoConfirmacao } from '../componentes/DialogoConfirmacao';
import { EditorAnotacao } from '../componentes/EditorAnotacao';
import { Markdown } from '../componentes/markdown';
import { MenuAcoes, type AcaoMenu } from '../componentes/MenuAcoes';
import { NOME_COR } from '../componentes/nomesCores';
import { Paginacao } from '../componentes/Paginacao';
import { useDependencias } from '../contexto/Dependencias';
import { useEditarAnotacoes } from '../hooks/useAnotacoes';
import { useEditarDestaques } from '../hooks/useDestaques';
import { useEstudos } from '../hooks/useEstudos';
import { useRemoverFavorito } from '../hooks/useFavoritos';
import {
  consultaEstudosDoEstado,
  estadoEstudosDaUrl,
  parametrosEstudos,
  type EstadoEstudos,
} from '../parametrosEstudos';
import { caminhoLeitura } from '../rotas';

/** Espera após a última tecla antes de filtrar (como na busca, RF02.6). */
const DEBOUNCE_MS = 250;

const ABA: Record<AbaEstudos, { titulo: string; um: string; varios: string; id: string }> = {
  FAVORITOS: { titulo: 'Favoritos', um: 'favorito', varios: 'favoritos', id: 'favoritos' },
  DESTAQUES: { titulo: 'Destaques', um: 'destaque', varios: 'destaques', id: 'destaques' },
  ANOTACOES: { titulo: 'Anotações', um: 'anotação', varios: 'anotações', id: 'anotacoes' },
};

const ROTULO_ORDEM: Record<OrdemEstudos, string> = {
  BIBLICA: 'Ordem bíblica',
  RECENTES: 'Mais recentes',
};

const ROTULO_EXIBICAO = { RODAPE: 'rodapé', INLINE: 'inline' } as const;

const data = (d: Date) => d.toLocaleDateString('pt-BR');

/** "João 3:16", ou "João 3:16–18" para um destaque que passa de um versículo. */
function nomeDoItem(item: ItemEstudo, canon: Canon): string {
  const ref = referenciaDaMarcacao(item);
  const nome = ref.formatar(canon.livro(ref.livro));
  if (item.tipo !== 'DESTAQUE') return nome;
  const { inicio, fim } = item.destaque.intervalo;
  return fim.numero > inicio.numero ? `${nome}–${fim.numero}` : nome;
}

type Dialogo =
  | { tipo: 'remover'; item: ItemEstudo; nome: string }
  | { tipo: 'editar'; anotacao: Anotacao; nome: string };

/** UC13 — Meus Estudos: favoritos, destaques e anotações com filtro, ordem e paginação. */
export function EstudosPage() {
  const { canon } = useDependencias();
  const [params, setParams] = useSearchParams();
  const estado = estadoEstudosDaUrl(params, canon);
  const consulta = consultaEstudosDoEstado(estado);
  const estudos = useEstudos(consulta, parametrosEstudos(estado).toString());
  const resultado = estudos.data;

  // Filtro de texto: o campo responde na hora; a URL (e a lista) depois do debounce.
  const [texto, setTexto] = useState(estado.q);
  const [qConhecido, setQConhecido] = useState(estado.q);
  if (estado.q !== qConhecido) {
    setQConhecido(estado.q);
    setTexto(estado.q);
  }
  const atualizar = (mudancas: Partial<EstadoEstudos>, { manterPagina = false } = {}) => {
    const novo = { ...estado, ...(manterPagina ? {} : { pagina: 1 }), ...mudancas };
    setQConhecido(novo.q);
    setParams(parametrosEstudos(novo), { replace: true });
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

  // Depois de remover o último item da última página, volta para a página anterior.
  const pagina = resultado?.pagina;
  useEffect(() => {
    if (pagina && pagina.itens.length === 0 && pagina.total > 0 && estado.pagina > 1) {
      atualizarRef.current({ pagina: pagina.totalPaginas() }, { manterPagina: true });
    }
  }, [pagina, estado.pagina]);

  const tituloLista = useRef<HTMLHeadingElement>(null);
  const irParaPagina = (n: number) => {
    atualizar({ pagina: n }, { manterPagina: true });
    window.scrollTo?.({ top: 0 });
    tituloLista.current?.focus({ preventScroll: true });
  };

  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [aviso, setAviso] = useState('');
  const removerFavorito = useRemoverFavorito();
  const editarDestaques = useEditarDestaques();
  const editarAnotacoes = useEditarAnotacoes();
  const ocupado =
    removerFavorito.isPending || editarDestaques.isPending || editarAnotacoes.isPending;
  const [erro, setErro] = useState<string | null>(null);
  const falhou = (e: unknown) =>
    setErro(`Não foi possível salvar. ${e instanceof Error ? e.message : ''}`.trim());

  const fecharDialogo = () => {
    setDialogo(null);
    setErro(null);
  };
  // Foco no título da lista quando o diálogo fecha (o item pode ter saído da lista).
  const focarLista = () => setTimeout(() => tituloLista.current?.focus(), 0);
  const concluir = (mensagem: string) => {
    fecharDialogo();
    setAviso(mensagem);
    focarLista();
  };

  const remover = (item: ItemEstudo, nome: string) => {
    const opcoes = { onSuccess: () => concluir(`Removido: ${nome}.`), onError: falhou };
    if (item.tipo === 'FAVORITO') removerFavorito.mutate(item.favorito, opcoes);
    if (item.tipo === 'DESTAQUE') {
      editarDestaques.mutate({ tipo: 'remover', destaque: item.destaque }, opcoes);
    }
    if (item.tipo === 'ANOTACAO') {
      editarAnotacoes.mutate({ tipo: 'excluir', anotacao: item.anotacao }, opcoes);
    }
  };

  const acoes = (item: ItemEstudo, nome: string): AcaoMenu[] => {
    const pedirRemocao = { tipo: 'remover', item, nome } as const;
    switch (item.tipo) {
      case 'FAVORITO':
        return [
          {
            rotulo: 'Remover dos favoritos',
            perigosa: true,
            onSelecionar: () => setDialogo(pedirRemocao),
          },
        ];
      case 'DESTAQUE':
        return [
          ...CorDestaque.todas.map((cor) => ({
            rotulo: `Cor ${NOME_COR[cor]}`,
            icone: (
              <span
                aria-hidden="true"
                data-cor={cor}
                className="amostra-cor size-4 rounded-full border border-stone-400/60"
              />
            ),
            atual: item.destaque.cor === cor,
            onSelecionar: () =>
              editarDestaques.mutate(
                { tipo: 'cor', destaque: item.destaque, cor },
                {
                  onSuccess: () => setAviso(`${nome} agora em ${NOME_COR[cor]}.`),
                  onError: (e) => setAviso(`Não foi possível mudar a cor. ${String(e)}`),
                },
              ),
          })),
          {
            rotulo: 'Remover destaque',
            perigosa: true,
            onSelecionar: () => setDialogo(pedirRemocao),
          },
        ];
      case 'ANOTACAO':
        return [
          {
            rotulo: 'Editar nota',
            onSelecionar: () => setDialogo({ tipo: 'editar', anotacao: item.anotacao, nome }),
          },
          {
            rotulo: 'Excluir nota',
            perigosa: true,
            onSelecionar: () => setDialogo(pedirRemocao),
          },
        ];
    }
  };

  const filtrado = estado.q.trim() !== '' || estado.livro !== null;
  const aba = ABA[estado.aba];
  const totalGeral = resultado
    ? resultado.totais.FAVORITOS + resultado.totais.DESTAQUES + resultado.totais.ANOTACOES
    : 0;

  const status = (() => {
    if (!pagina) return 'Carregando…';
    if (pagina.total === 0) return filtrado ? `Nenhum item em ${aba.titulo} com esse filtro.` : '';
    const nome = pagina.total === 1 ? aba.um : aba.varios;
    return `${pagina.total.toLocaleString('pt-BR')} ${nome} · página ${pagina.pagina} de ${pagina.totalPaginas()}`;
  })();

  return (
    <>
      <BarraSuperior />
      <main className="mx-auto max-w-3xl px-4 py-6 font-sans sm:py-8">
        <h1 className="sr-only">Meus Estudos</h1>

        <Abas
          atual={estado.aba}
          totais={resultado?.totais}
          onEscolher={(a) => atualizar({ aba: a })}
        />

        <div
          role="tabpanel"
          id="painel-estudos"
          aria-labelledby={`aba-${aba.id}`}
          className="focus:outline-none"
        >
          <form
            role="search"
            aria-label={`Filtrar ${aba.titulo.toLowerCase()}`}
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 flex flex-wrap gap-2"
          >
            <div className="relative min-w-60 flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-500"
              >
                ⌕
              </span>
              <label htmlFor="filtro-estudos" className="sr-only">
                Filtrar no texto ou na nota
              </label>
              <input
                id="filtro-estudos"
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') atualizar({ q: texto });
                }}
                placeholder="Filtrar no texto ou na nota…"
                autoComplete="off"
                className="focus-visible:outline-primaria w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 pl-8 text-sm focus-visible:outline-2"
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-stone-600">Livro</span>
              <select
                value={estado.livro ?? ''}
                onChange={(e) => atualizar({ livro: e.target.value || null })}
                className="rounded-md border border-stone-300 bg-white px-2 py-2"
              >
                <option value="">Todos</option>
                {[Testamento.ANTIGO, Testamento.NOVO].map((t) => (
                  <optgroup
                    key={t}
                    label={t === Testamento.ANTIGO ? 'Antigo Testamento' : 'Novo Testamento'}
                  >
                    {canon
                      .livros()
                      .filter((l) => l.testamento === t)
                      .map((l) => (
                        <option key={l.codigo.valor} value={l.codigo.valor}>
                          {l.nome}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-stone-600">Ordenar</span>
              <select
                value={estado.ordem}
                onChange={(e) =>
                  atualizar({
                    ordem: OrdemEstudos.todas.find((o) => o === e.target.value) ?? 'BIBLICA',
                  })
                }
                className="rounded-md border border-stone-300 bg-white px-2 py-2"
              >
                {OrdemEstudos.todas.map((o) => (
                  <option key={o} value={o}>
                    {ROTULO_ORDEM[o]}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <div className="mt-4 flex min-h-8 items-center border-b border-stone-300 pb-2">
            <h2 ref={tituloLista} tabIndex={-1} className="text-sm focus:outline-none">
              <span className="sr-only">{aba.titulo}. </span>
              <span role="status" className="text-stone-700">
                {status}
              </span>
            </h2>
          </div>
          <p aria-live="polite" className="sr-only">
            {aviso}
          </p>

          {estudos.isError && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              Não foi possível carregar seus estudos.{' '}
              {estudos.error instanceof Error ? estudos.error.message : ''}
            </p>
          )}

          {pagina?.total === 0 &&
            (filtrado ? (
              <div className="mt-6 text-sm text-stone-600">
                <p>Nenhum item corresponde ao filtro.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTexto('');
                    atualizar({ q: '', livro: null });
                  }}
                  className="text-primaria mt-2 rounded-sm font-medium hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <EstadoVazio aba={estado.aba} nada={totalGeral === 0} />
            ))}

          {pagina && pagina.itens.length > 0 && (
            <ol
              aria-label={aba.titulo}
              aria-busy={estudos.isFetching}
              className={`divide-y divide-stone-200 ${estudos.isPlaceholderData ? 'opacity-60' : ''}`}
            >
              {pagina.itens.map((item) => {
                const nome = nomeDoItem(item, canon);
                return (
                  <ItemDaLista
                    key={chaveDoItem(item)}
                    item={item}
                    nome={nome}
                    acoes={acoes(item, nome)}
                  />
                );
              })}
            </ol>
          )}

          {pagina && (
            <Paginacao
              atual={pagina.pagina}
              total={pagina.totalPaginas()}
              onIr={irParaPagina}
              rotulo={`Páginas de ${aba.titulo.toLowerCase()}`}
            />
          )}
        </div>
      </main>

      {dialogo?.tipo === 'remover' && (
        <DialogoConfirmacao
          {...TEXTO_REMOCAO[dialogo.item.tipo](dialogo.nome)}
          ocupado={ocupado}
          erro={erro}
          onConfirmar={() => remover(dialogo.item, dialogo.nome)}
          onFechar={() => {
            fecharDialogo();
            focarLista();
          }}
        />
      )}
      {dialogo?.tipo === 'editar' && (
        <EditorAnotacao
          titulo={`Nota em ${dialogo.nome}`}
          inicial={dialogo.anotacao}
          ocupado={ocupado}
          erro={erro}
          onSalvar={(conteudo, exibicao) =>
            editarAnotacoes.mutate(
              { tipo: 'editar', anotacao: dialogo.anotacao, conteudo, exibicao },
              { onSuccess: () => concluir(`Nota em ${dialogo.nome} salva.`), onError: falhou },
            )
          }
          onExcluir={() =>
            editarAnotacoes.mutate(
              { tipo: 'excluir', anotacao: dialogo.anotacao },
              { onSuccess: () => concluir(`Nota em ${dialogo.nome} excluída.`), onError: falhou },
            )
          }
          onFechar={() => {
            fecharDialogo();
            focarLista();
          }}
        />
      )}
    </>
  );
}

const TEXTO_REMOCAO: Record<
  ItemEstudo['tipo'],
  (nome: string) => { titulo: string; mensagem: string; confirmar: string }
> = {
  FAVORITO: (nome) => ({
    titulo: 'Remover dos favoritos?',
    mensagem: `${nome} deixa de ser favorito.`,
    confirmar: 'Remover favorito',
  }),
  DESTAQUE: (nome) => ({
    titulo: 'Remover destaque?',
    mensagem: `O destaque em ${nome} será apagado. As notas do trecho continuam no versículo.`,
    confirmar: 'Remover destaque',
  }),
  ANOTACAO: (nome) => ({
    titulo: 'Excluir nota?',
    mensagem: `A nota em ${nome} será apagada.`,
    confirmar: 'Excluir nota',
  }),
};

function chaveDoItem(item: ItemEstudo): string {
  switch (item.tipo) {
    case 'FAVORITO':
      return item.favorito.id;
    case 'DESTAQUE':
      return item.destaque.id;
    case 'ANOTACAO':
      return item.anotacao.id;
  }
}

/** RF09.1 — abas com o total de cada uma (padrão ARIA tabs, ativação automática). */
function Abas({
  atual,
  totais,
  onEscolher,
}: {
  atual: AbaEstudos;
  totais: Readonly<Record<AbaEstudos, number>> | undefined;
  onEscolher: (aba: AbaEstudos) => void;
}) {
  const lista = useRef<HTMLDivElement>(null);
  const aoTeclar = (e: KeyboardEvent) => {
    const i = AbaEstudos.todas.indexOf(atual);
    const n = AbaEstudos.todas.length;
    const destino = {
      ArrowRight: (i + 1) % n,
      ArrowLeft: (i - 1 + n) % n,
      Home: 0,
      End: n - 1,
    }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const aba = AbaEstudos.todas[destino];
    if (!aba) return;
    onEscolher(aba);
    lista.current?.querySelector<HTMLElement>(`#aba-${ABA[aba].id}`)?.focus();
  };

  return (
    <div
      ref={lista}
      role="tablist"
      aria-label="Meus Estudos"
      className="flex gap-1 overflow-x-auto border-b border-stone-300"
    >
      {AbaEstudos.todas.map((a) => {
        const selecionada = a === atual;
        return (
          <button
            key={a}
            id={`aba-${ABA[a].id}`}
            type="button"
            role="tab"
            aria-selected={selecionada}
            aria-controls="painel-estudos"
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onEscolher(a)}
            onKeyDown={aoTeclar}
            className={[
              'focus-visible:outline-primaria -mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap focus-visible:outline-2',
              selecionada
                ? 'border-tinta font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900',
            ].join(' ')}
          >
            {ABA[a].titulo}
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700 tabular-nums">
              {totais?.[a] ?? '–'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ItemDaLista({
  item,
  nome,
  acoes,
}: {
  item: ItemEstudo;
  nome: string;
  acoes: readonly AcaoMenu[];
}) {
  const ref = referenciaDaMarcacao(item);
  const meta = (() => {
    switch (item.tipo) {
      case 'FAVORITO':
        return data(item.favorito.criadoEm);
      case 'DESTAQUE':
        return `${data(item.destaque.criadoEm)} · ${NOME_COR[item.destaque.cor]}`;
      case 'ANOTACAO': {
        const a = item.anotacao;
        const quando =
          a.atualizadoEm > a.criadoEm ? `editada em ${data(a.atualizadoEm)}` : data(a.criadoEm);
        return `${quando} · ${ROTULO_EXIBICAO[a.exibicao]}`;
      }
    }
  })();

  return (
    <li className="flex items-start gap-1 py-1">
      <Link
        to={caminhoLeitura(ref)}
        className="focus-visible:outline-primaria -mx-2 min-w-0 flex-1 rounded-md px-2 py-2.5 hover:bg-stone-50 focus-visible:outline-2"
      >
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold">{nome}</span>
          <span className="text-xs text-stone-500">{meta}</span>
        </span>
        <span className="mt-1 block font-serif text-[1.05rem] leading-relaxed text-stone-800">
          {item.tipo === 'DESTAQUE' ? (
            <mark data-cor={item.destaque.cor} className="marca-texto cursor-auto!">
              {item.texto || '…'}
            </mark>
          ) : (
            item.texto || '…'
          )}
        </span>
        {item.tipo === 'ANOTACAO' && (
          <span className="conteudo-nota mt-2 block rounded-md border-l-4 border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-700">
            <Markdown texto={item.anotacao.conteudo} />
          </span>
        )}
      </Link>
      <div className="pt-1.5">
        <MenuAcoes rotulo={`Ações de ${nome}`} acoes={acoes} />
      </div>
    </li>
  );
}

const VAZIO: Record<AbaEstudos, string> = {
  FAVORITOS: 'Nenhum favorito ainda. Na leitura, toque no número do versículo para favoritar.',
  DESTAQUES: 'Nenhum destaque ainda. Na leitura, selecione um trecho e escolha uma cor.',
  ANOTACOES:
    'Nenhuma anotação ainda. Na leitura, toque no número do versículo ou num destaque e escolha Anotar.',
};

/** UC13 A5 — lista vazia: orientação de como marcar na leitura. */
function EstadoVazio({ aba, nada }: { aba: AbaEstudos; nada: boolean }) {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white/60 px-5 py-6 text-center text-sm text-stone-600">
      <p>{nada ? 'Selecione um texto na leitura para marcar, anotar ou favoritar.' : VAZIO[aba]}</p>
      <Link to="/" className="text-primaria mt-3 inline-block font-medium hover:underline">
        Ir para a leitura
      </Link>
    </div>
  );
}
