import { Fragment, useEffect, useRef } from 'react';
import type { CapituloAberto } from '../../aplicacao/casos-de-uso';

interface Props {
  aberto: CapituloAberto;
  nomeVersao: string;
}

/**
 * RF01.6 — Página de leitura com aparência de folha de papel: cabeçalho corrente,
 * título do livro, texto serifado justificado e número do versículo sobrescrito.
 */
export function PaginaPapel({ aberto, nomeVersao }: Props) {
  const { capitulo, livro, versiculoEmFoco } = aberto;
  const titulo = useRef<HTMLHeadingElement>(null);

  // Ao trocar de capítulo: rola até o versículo em foco (UC02) ou ao topo.
  useEffect(() => {
    const alvo = versiculoEmFoco ? document.getElementById(`v${versiculoEmFoco}`) : null;
    if (alvo) {
      alvo.scrollIntoView?.({ block: 'center' });
    } else {
      window.scrollTo?.({ top: 0 });
    }
  }, [capitulo, versiculoEmFoco]);

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
        {capitulo.versiculos.map((v) => (
          <Fragment key={v.numero}>
            <span
              id={`v${v.numero}`}
              data-ref={v.referencia.chave()}
              className={v.numero === versiculoEmFoco ? 'versiculo-foco' : undefined}
            >
              <sup className="text-tinta-suave mr-0.5 font-sans text-[0.6em] font-semibold">
                {v.numero}
              </sup>
              {v.texto}
            </span>{' '}
          </Fragment>
        ))}
      </p>
    </article>
  );
}
