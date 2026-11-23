import { Fragment, useEffect, useRef, type ReactNode, type Ref } from 'react';
import type { CapituloAberto } from '../../aplicacao/casos-de-uso';
import type { DestaqueId, FaixaDestacada } from '../../dominio/estudo';
import { idBotaoVersiculo } from './idsVersiculo';
import { ATRIBUTO_TEXTO } from './selecaoTexto';

const semFaixas = () => [];

interface Props {
  aberto: CapituloAberto;
  nomeVersao: string;
  /** RF03.1 — indica se o versículo é favorito (★ antes do número). */
  favoritado?: (versiculo: number) => boolean;
  /** Versículo com a barra de ações aberta, ou `null`. */
  selecionado?: number | null;
  /** Toque/clique no número do versículo (abre ou fecha a barra de ações). */
  onAcoesVersiculo?: (versiculo: number) => void;
  /** RF04 — trechos com marca-texto no versículo (texto com `tamanho` caracteres). */
  faixas?: (versiculo: number, tamanho: number) => FaixaDestacada[];
  /** Destaque com a barra de ações aberta, ou `null`. */
  destaqueAtivo?: DestaqueId | null;
  /** Toque/clique num trecho marcado (UC05 A2). */
  onTocarDestaque?: (destaque: DestaqueId) => void;
  /** Elemento com o texto bíblico (raiz da seleção do marca-texto). */
  refTexto?: Ref<HTMLParagraphElement>;
}

/**
 * RF01.6 — Página de leitura com aparência de folha de papel: cabeçalho corrente,
 * título do livro, texto serifado justificado e número do versículo sobrescrito.
 * O número do versículo é um botão que abre as ações do versículo (UC04). Os trechos
 * destacados (RF04) são `<mark>`; o texto de cada versículo fica num elemento próprio,
 * para que a seleção conte offsets só do texto (UC05 A3).
 */
export function PaginaPapel({
  aberto,
  nomeVersao,
  favoritado = () => false,
  selecionado = null,
  onAcoesVersiculo,
  faixas = semFaixas,
  destaqueAtivo = null,
  onTocarDestaque,
  refTexto,
}: Props) {
  const { capitulo, livro, versiculoEmFoco } = aberto;
  const titulo = useRef<HTMLHeadingElement>(null);
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

  const faixasPorVersiculo = capitulo.versiculos.map((v) => faixas(v.numero, v.texto.length));
  const emendas = capitulo.versiculos.map((v, i) => {
    const ultima = faixasPorVersiculo[i]?.at(-1);
    const primeiraSeguinte = faixasPorVersiculo[i + 1]?.[0];
    return (
      ultima?.ate === v.texto.length &&
      primeiraSeguinte?.de === 0 &&
      primeiraSeguinte.destaque === ultima.destaque
    );
  });

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

      <h1 id="titulo-capitulo" ref={titulo} className="mt-8 text-center">
        <span className="block text-4xl tracking-wide uppercase sm:text-5xl">{livro.nome}</span>
        <span className="text-tinta-suave mt-2 block font-sans text-xs tracking-[0.3em] uppercase">
          Capítulo {capitulo.numero}
        </span>
      </h1>

      <p ref={refTexto} className="texto-biblico mt-8 text-lg leading-[1.85] sm:text-[1.2rem]">
        {capitulo.versiculos.map((v, i) => {
          const favorito = favoritado(v.numero);
          const doVersiculo = faixasPorVersiculo[i] ?? [];
          // Um destaque que atravessa versículos também cobre o espaço e o número entre eles.
          const emendaAntes = i > 0 && emendas[i - 1] === true;
          const emendaDepois = emendas[i] === true;
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
                  {comMarcas(v.texto, doVersiculo, destaqueAtivo, emendaAntes, emendaDepois)}
                </span>
              </span>
              {emendaDepois ? emenda(doVersiculo.at(-1), destaqueAtivo, ' ') : ' '}
            </Fragment>
          );
        })}
      </p>
    </article>
  );
}

/**
 * Divide o texto em trechos simples e marcados (as faixas não se sobrepõem). As pontas
 * emendadas com o versículo vizinho ficam retas, para o traço parecer contínuo.
 */
function comMarcas(
  texto: string,
  faixas: readonly FaixaDestacada[],
  ativo: DestaqueId | null,
  emendaAntes: boolean,
  emendaDepois: boolean,
): ReactNode[] {
  const partes: ReactNode[] = [];
  let pos = 0;
  faixas.forEach((f, i) => {
    if (f.de > pos) partes.push(texto.slice(pos, f.de));
    const classes = classesMarca(f, ativo, {
      inicio: i === 0 && emendaAntes,
      fim: i === faixas.length - 1 && emendaDepois,
    });
    partes.push(
      <mark key={f.de} data-destaque={f.destaque} data-cor={f.cor} className={classes}>
        {texto.slice(f.de, f.ate)}
      </mark>,
    );
    pos = f.ate;
  });
  if (pos < texto.length) partes.push(texto.slice(pos));
  return partes;
}

/** Trecho entre dois versículos (espaço ou número) coberto por um destaque que continua. */
function emenda(f: FaixaDestacada | undefined, ativo: DestaqueId | null, conteudo: ReactNode) {
  if (!f) return conteudo;
  const classes = classesMarca(f, ativo, { inicio: true, fim: true });
  return typeof conteudo === 'string' ? (
    <mark data-destaque={f.destaque} data-cor={f.cor} className={classes}>
      {conteudo}
    </mark>
  ) : (
    // Envolve o número do versículo (um botão): não é texto destacado, só visual.
    <span data-cor={f.cor} className={classes}>
      {conteudo}
    </span>
  );
}

function classesMarca(
  f: FaixaDestacada,
  ativo: DestaqueId | null,
  emenda: { inicio: boolean; fim: boolean },
): string {
  return [
    'marca-texto',
    f.destaque === ativo && 'marca-texto-ativa',
    emenda.inicio && 'marca-emenda-inicio',
    emenda.fim && 'marca-emenda-fim',
  ]
    .filter(Boolean)
    .join(' ');
}
