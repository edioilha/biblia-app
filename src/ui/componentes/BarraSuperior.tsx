import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

const SECOES = [
  { para: '/', rotulo: 'Ler', ativaEm: /^\/(ler\/|$)/u },
  { para: '/buscar', rotulo: 'Buscar', ativaEm: /^\/buscar/u },
] as const;

/** Barra de navegação principal (docs/05 — wireframes). Demais seções entram nas fases 7.6+. */
export function BarraSuperior({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-stone-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className="bg-tinta inline-block size-4 rounded-sm" />
          <span className="max-sm:sr-only">Bíblia</span>
        </span>
        <nav aria-label="Principal" className="mr-auto">
          <ul className="flex gap-1 text-sm">
            {SECOES.map((s) => (
              <li key={s.para}>
                <Link
                  to={s.para}
                  aria-current={s.ativaEm.test(pathname) ? 'page' : undefined}
                  className={[
                    'focus-visible:outline-primaria rounded-md px-3 py-1.5 focus-visible:outline-2',
                    s.ativaEm.test(pathname) ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50',
                  ].join(' ')}
                >
                  {s.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </div>
    </header>
  );
}
