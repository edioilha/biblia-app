import type { ReactNode } from 'react';

/** Barra de navegação principal (docs/05 — wireframes). Demais seções entram nas fases 7.2+. */
export function BarraSuperior({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-stone-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className="bg-tinta inline-block size-4 rounded-sm" />
          Bíblia
        </span>
        <nav aria-label="Principal" className="mr-auto">
          <ul className="flex gap-1 text-sm">
            <li>
              <span aria-current="page" className="rounded-md bg-stone-100 px-3 py-1.5 font-medium">
                Ler
              </span>
            </li>
          </ul>
        </nav>
        {children}
      </div>
    </header>
  );
}
