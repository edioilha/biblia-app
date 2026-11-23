import { Fragment, useEffect, useRef, type ReactNode, type Ref } from 'react';
import type { CapituloAberto } from '../../aplicacao/casos-de-uso';
import type { Versiculo } from '../../dominio/biblia';
import type {
  Anotacao,
  DestaqueId,
  FaixaDestacada,
  MarcacoesDoCapitulo,
  NotaAncorada,
} from '../../dominio/estudo';
import { idBotaoVersiculo } from './idsVersiculo';
import { Markdown } from './markdown';
import { ATRIBUTO_TEXTO } from './selecaoTexto';
import { emenda, idMarcador, idNotaRodape, textoComMarcacoes } from './textoVersiculo';

interface Props {
  aberto: CapituloAberto;
  nomeVersao: string;
  /** Favoritos, destaques e anotações do capítulo (ainda carregando: `undefined`). */
  marcacoes?: MarcacoesDoCapitulo | undefined;
  /** RF03.1 — indica se o versículo é favorito (★ antes do número); permite o otimista. */
  favoritado?: (versiculo: number) => boolean;
  /** Versículo com a barra de ações aberta, ou `null`. */
  selecionado?: number | null;
  /** Toque/clique no número do versículo (abre ou fecha a barra de ações). */
  onAcoesVersiculo?: (versiculo: number) => void;
  /** Destaque com a barra de ações aberta, ou `null`. */
  destaqueAtivo?: DestaqueId | null;
  /** Toque/clique num trecho marcado (UC05 A2). */
  onTocarDestaque?: (destaque: DestaqueId) => void;
  /** UC06 A1 — editar uma nota (rodapé ou inline). */
  onEditarNota?: (anotacao: Anotacao) => void;
  /** Elemento com o texto bíblico (raiz da seleção do marca-texto). */
  refTexto?: Ref<HTMLDivElement>;
}

/**
 * RF01.6 — Página de leitura com aparência de folha de papel: cabeçalho corrente,
 * título do livro, texto serifado justificado e número do versículo sobrescrito.
 * - O número do versículo é um botão que abre as ações do versículo (UC04).
 * - Trechos destacados (RF04) são `<mark>`; o texto de cada versículo fica num elemento
 *   próprio, para que a seleção conte offsets só do texto (UC05 A3).
 * - Notas (RF05.3): as de rodapé têm marcador numerado no texto e ficam no pé da página;
 *   as inline aparecem logo após o versículo, dividindo o texto em parágrafos.
 */
export function PaginaPapel({
  aberto,
  nomeVersao,
  marcacoes,
  favoritado = (n) => marcacoes?.favoritado(n) ?? false,
  selecionado = null,
  onAcoesVersiculo,
  destaqueAtivo = null,
  onTocarDestaque,
  onEditarNota,
  refTexto,
}: Props) {
  const { capitulo, livro, versiculoEmFoco } = aberto;
  const pagina = useRef<HTMLElement>(null);
  const tocarDestaque = useRef(onTocarDestaque);
  useEffect(() => {
    tocarDestaque.current = onTocarDestaque;
  });

  // UC05 A2 — clique num <mark> sem selecionar texto abre as ações do destaque. Ouvinte
  // nativo: pelo teclado, o caminho é a barra do versículo ("Remover marcação").
  useEffect(() => {
    const el = pagina.current;
    function aoClicar(e: MouseEvent) {
      if (!(e.target instanceof Element) || !document.getSelection()?.isCollapsed) return;
      const id = e.target.closest('mark[data-destaque]')?.getAttribute('data-destaque');
      if (id) tocarDestaque.current?.(id as DestaqueId);
    }
    el?.addEventListener('click', aoClicar);
    return () => el?.removeEventListener('click', aoClicar);
  }, []);
  const chaveCapitulo = capitulo.referencia.chave();

  // Ao trocar de capítulo: rola até o versículo em foco (UC02) ou ao topo.
  // Depende da chave (não do objeto), para não rolar quando o mesmo capítulo é relido.
  useEffect(() => {
    const alvo = versiculoEmFoco ? document.getElementById(`v${versiculoEmFoco}`) : null;
    if (alvo) {
      alvo.scrollIntoView?.({ block: 'center' });
    } else {
      window.scrollTo?.({ top: 0 });
    }
  }, [chaveCapitulo, versiculoEmFoco]);

  const faixas = capitulo.versiculos.map(
    (v) => marcacoes?.faixasDestacadas(v.numero, v.texto.length) ?? [],
  );
  const emendas = capitulo.versiculos.map((v, i) => {
    const ultima = faixas[i]?.at(-1);
    const primeiraSeguinte = faixas[i + 1]?.[0];
    return (
      ultima?.ate === v.texto.length &&
      primeiraSeguinte?.de === 0 &&
      primeiraSeguinte.destaque === ultima.destaque
    );
  });
  const rodape = marcacoes?.notasDeRodape() ?? [];
  const nomeVersiculo = (n: number) => `${livro.abreviacao} ${capitulo.numero}:${n}`;

  // Divide o texto em parágrafos após cada versículo com nota inline.
  const paragrafos: { versiculos: Versiculo[]; inline: NotaAncorada[] }[] = [];
  let atual: Versiculo[] = [];
  for (const v of capitulo.versiculos) {
    atual.push(v);
    const inline = marcacoes?.notasInline(v.numero) ?? [];
    if (inline.length > 0) {
      paragrafos.push({ versiculos: atual, inline });
      atual = [];
    }
  }
  if (atual.length > 0) paragrafos.push({ versiculos: atual, inline: [] });

  const renderizarVersiculo = (v: Versiculo, ultimoDoParagrafo: boolean): ReactNode => {
    const i = capitulo.versiculos.indexOf(v);
    const doVersiculo: readonly FaixaDestacada[] = faixas[i] ?? [];
    const emendaAntes = i > 0 && emendas[i - 1] === true;
    const emendaDepois = emendas[i] === true && !ultimoDoParagrafo;
    const favorito = favoritado(v.numero);
    const aberta = selecionado === v.numero;
    const classes = [
      v.numero === versiculoEmFoco && 'versiculo-foco',
      aberta && 'versiculo-selecionado',
    ].filter(Boolean);
    return (
      <Fragment key={v.numero}>
        <span
          id={`v${v.numero}`}
          data-ref={v.referencia.chave()}
          className={classes.length ? classes.join(' ') : undefined}
        >
          {emenda(
            emendaAntes ? doVersiculo[0] : undefined,
            destaqueAtivo,
            <sup className="text-tinta-suave mr-0.5 font-sans text-[0.6em] font-semibold select-none">
              <button
                id={idBotaoVersiculo(v.numero)}
                type="button"
                onClick={() => onAcoesVersiculo?.(v.numero)}
                aria-label={`Versículo ${v.numero}${favorito ? ', favorito' : ''}`}
                aria-expanded={aberta}
                aria-controls={aberta ? 'acoes-versiculo' : undefined}
                title="Ações do versículo"
                className="hover:text-primaria focus-visible:outline-primaria -mx-0.5 cursor-pointer rounded-sm px-0.5 py-0.5 leading-none focus-visible:outline-2"
              >
                {favorito && (
                  <span aria-hidden="true" className="mr-px text-amber-700">
                    ★
                  </span>
                )}
                {v.numero}
              </button>
            </sup>,
          )}
          <span {...{ [ATRIBUTO_TEXTO]: v.numero }}>
            {textoComMarcacoes(v.texto, {
              faixas: doVersiculo,
              marcadores: marcacoes?.marcadores(v.numero) ?? [],
              ativo: destaqueAtivo,
              emendaAntes,
              emendaDepois,
              onMarcador: irParaNota,
            })}
          </span>
        </span>
        {!ultimoDoParagrafo &&
          (emendaDepois ? emenda(doVersiculo.at(-1), destaqueAtivo, ' ') : ' ')}
      </Fragment>
    );
  };

  return (
    <article
      ref={pagina}
      lang="pt-BR"
      aria-labelledby="titulo-capitulo"
      className="pagina-papel border-papel-borda mx-auto w-full max-w-2xl rounded-sm border px-6 pt-8 pb-12 font-serif shadow-xl sm:px-14 sm:pt-10"
    >
      <header className="text-tinta-suave flex justify-between gap-4 font-sans text-[0.7rem] tracking-[0.18em] uppercase">
        <span>{livro.nome}</span>
        <span>{nomeVersao}</span>
      </header>

      <h1 id="titulo-capitulo" className="mt-8 text-center">
        <span className="block text-4xl tracking-wide uppercase sm:text-5xl">{livro.nome}</span>
        <span className="text-tinta-suave mt-2 block font-sans text-xs tracking-[0.3em] uppercase">
          Capítulo {capitulo.numero}
        </span>
      </h1>

      <div ref={refTexto} className="texto-biblico mt-8 text-lg leading-[1.85] sm:text-[1.2rem]">
        {paragrafos.map((p) => (
          <Fragment key={p.versiculos[0]?.numero}>
            <p>
              {p.versiculos.map((v, i) => renderizarVersiculo(v, i === p.versiculos.length - 1))}
            </p>
            {p.inline.map((n) => (
              <aside
                key={n.anotacao.id}
                aria-label={`Nota em ${nomeVersiculo(n.anotacao.referencia.versiculo ?? 0)}`}
                className="nota-inline my-4 rounded-r-sm border-l-4 border-amber-400/70 bg-stone-500/[0.06] py-2.5 pr-3 pl-4 font-sans text-[0.95rem] leading-relaxed"
              >
                <div className="conteudo-nota">
                  <Markdown texto={n.anotacao.conteudo} />
                </div>
                <BotaoNota onClick={() => onEditarNota?.(n.anotacao)}>Editar nota</BotaoNota>
              </aside>
            ))}
          </Fragment>
        ))}
      </div>

      {rodape.length > 0 && (
        <section
          aria-labelledby="titulo-notas"
          className="border-papel-borda mt-10 border-t pt-4 font-sans text-sm leading-relaxed"
        >
          <h2 id="titulo-notas" className="sr-only">
            Notas do capítulo
          </h2>
          <ol className="flex flex-col gap-3">
            {rodape.map((n) => (
              <li
                key={n.anotacao.id}
                id={idNotaRodape(n.anotacao.id)}
                tabIndex={-1}
                className="focus-visible:outline-primaria flex gap-2 rounded-sm focus-visible:outline-2"
              >
                <span className="text-primaria font-semibold tabular-nums">{n.numero}</span>
                <div className="min-w-0 flex-1">
                  <strong className="font-semibold">
                    {nomeVersiculo(n.anotacao.referencia.versiculo ?? 0)}
                  </strong>
                  <div className="conteudo-nota">
                    <Markdown texto={n.anotacao.conteudo} />
                  </div>
                  <div className="mt-0.5 flex gap-1">
                    <BotaoNota onClick={() => onEditarNota?.(n.anotacao)}>Editar nota</BotaoNota>
                    <BotaoNota
                      onClick={() => voltarAoMarcador(n)}
                      rotulo={`Voltar ao marcador ${n.numero}`}
                    >
                      ↩︎ Voltar ao texto
                    </BotaoNota>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

/** RF05.3 — marcador → nota no rodapé (rola e foca). */
function irParaNota(nota: NotaAncorada) {
  const el = document.getElementById(idNotaRodape(nota.anotacao.id));
  el?.scrollIntoView?.({ block: 'center' });
  el?.focus({ preventScroll: true });
}

function voltarAoMarcador(nota: NotaAncorada) {
  const el = document.getElementById(idMarcador(nota.anotacao.id));
  el?.scrollIntoView?.({ block: 'center' });
  el?.focus({ preventScroll: true });
}

function BotaoNota({
  onClick,
  rotulo,
  children,
}: {
  onClick: () => void;
  rotulo?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="text-primaria focus-visible:outline-primaria -ml-1 rounded-sm px-1 py-0.5 text-xs font-medium hover:underline focus-visible:outline-2"
    >
      {children}
    </button>
  );
}
