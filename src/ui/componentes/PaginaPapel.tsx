import { Fragment, useEffect, useRef } from 'react';
import type { CapituloAberto } from '../../aplicacao/casos-de-uso';
import { idBotaoVersiculo } from './idsVersiculo';

interface Props {
  aberto: CapituloAberto;
  nomeVersao: string;
  /** RF03.1 — indica se o versículo é favorito (★ antes do número). */
  favoritado?: (versiculo: number) => boolean;
  /** Versículo com a barra de ações aberta, ou `null`. */
  selecionado?: number | null;
  /** Toque/clique no número do versículo (abre ou fecha a barra de ações). */
  onAcoesVersiculo?: (versiculo: number) => void;
}

/**
 * RF01.6 — Página de leitura com aparência de folha de papel: cabeçalho corrente,
 * título do livro, texto serifado justificado e número do versículo sobrescrito.
 * O número do versículo é um botão que abre as ações do versículo (UC04).
 */
export function PaginaPapel({
  aberto,
  nomeVersao,
  favoritado = () => false,
  selecionado = null,
  onAcoesVersiculo,
}: Props) {
  const { capitulo, livro, versiculoEmFoco } = aberto;
  const titulo = useRef<HTMLHeadingElement>(null);
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

  return (
    <article
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

      <p className="texto-biblico mt-8 text-lg leading-[1.85] sm:text-[1.2rem]">
        {capitulo.versiculos.map((v) => {
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
                <sup className="text-tinta-suave mr-0.5 font-sans text-[0.6em] font-semibold">
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
                </sup>
                {v.texto}
              </span>{' '}
            </Fragment>
          );
        })}
      </p>
    </article>
  );
}
