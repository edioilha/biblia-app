import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

const icone = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const SECOES = [
  {
    para: '/',
    rotulo: 'Ler',
    curto: 'Ler',
    icone: icone(
      'M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13',
    ),
    ativaEm: /^\/(ler\/|$)/u,
  },
  {
    para: '/buscar',
    rotulo: 'Buscar',
    curto: 'Buscar',
    icone: icone('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4'),
    ativaEm: /^\/buscar/u,
  },
  {
    para: '/planos',
    rotulo: 'Planos',
    curto: 'Planos',
    icone: icone('M5 6h14v14H5zM5 10h14M9 3v4M15 3v4M9 14l2 2 4-4'),
    ativaEm: /^\/planos/u,
  },
  {
    para: '/estudos',
    rotulo: 'Meus Estudos',
    curto: 'Estudos',
    icone: icone('M7 4h10v16l-5-3.5L7 20z'),
    ativaEm: /^\/estudos/u,
  },
  {
    para: '/versoes',
    rotulo: 'Versões',
    curto: 'Versões',
    icone: icone('M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5'),
    ativaEm: /^\/versoes/u,
  },
] as const;

/**
 * Navegação principal (docs/05 — wireframes): barra superior no desktop e *tab bar*
 * inferior no celular (< 640 px), onde não cabe junto do seletor de referência. É o mesmo
 * `<nav>`; no celular ele fica fixo no rodapé.
 *
 * O cabeçalho só usa `backdrop-blur` a partir de `sm`: o filtro faria do cabeçalho o
 * contêiner do `position: fixed` e prenderia a tab bar dentro dele.
 */
export function BarraSuperior({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-stone-300 bg-white/95 sm:backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <span className="flex items-center gap-2 font-semibold max-sm:mr-auto max-sm:min-h-9">
          <span aria-hidden="true" className="bg-tinta inline-block size-4 rounded-sm" />
          <span className="max-sm:sr-only">Bíblia</span>
        </span>
        <nav
          aria-label="Principal"
          className="max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 max-sm:border-t max-sm:border-stone-300 max-sm:bg-white max-sm:pb-[env(safe-area-inset-bottom,0px)] sm:mr-auto"
        >
          <ul className="flex gap-1 text-sm whitespace-nowrap max-sm:h-14 max-sm:gap-0">
            {SECOES.map((s) => {
              const ativa = s.ativaEm.test(pathname);
              return (
                <li key={s.para} className="max-sm:flex-1">
                  <Link
                    to={s.para}
                    aria-label={s.rotulo}
                    aria-current={ativa ? 'page' : undefined}
                    className={[
                      'focus-visible:outline-primaria rounded-md px-3 py-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2',
                      'max-sm:flex max-sm:h-full max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-0.5 max-sm:rounded-none max-sm:px-1 max-sm:py-0 max-sm:text-xs',
                      ativa
                        ? 'max-sm:text-tinta font-medium sm:bg-stone-100'
                        : 'max-sm:text-stone-500 sm:hover:bg-stone-50',
                    ].join(' ')}
                  >
                    <span className="sm:hidden">{s.icone}</span>
                    <span className="max-sm:hidden">{s.rotulo}</span>
                    <span className="sm:hidden">{s.curto}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {children}
      </div>
    </header>
  );
}
