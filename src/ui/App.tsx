import { useDependencias } from './contexto/Dependencias';

export function App() {
  const { canon } = useDependencias();
  const totalCapitulos = canon.livros().reduce((soma, l) => soma + l.totalCapitulos, 0);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <article className="border-papel-borda bg-papel w-full max-w-xl rounded-sm border px-8 py-12 text-center font-serif shadow-xl sm:px-14">
        <p className="text-tinta-suave font-sans text-xs tracking-[0.2em] uppercase">
          Leitura e estudo
        </p>
        <h1 className="mt-2 text-4xl tracking-wide">Bíblia App</h1>
        <p className="mt-6 text-lg leading-relaxed">
          <mark className="bg-marca-texto rounded-sm px-1 text-inherit">Em desenvolvimento.</mark>{' '}
          Leitura em página de papel, marca-texto, anotações, busca e planos de leitura — tudo
          offline.
        </p>
        <p className="text-tinta-suave mt-6 font-sans text-sm">
          {canon.livros().length} livros · {totalCapitulos} capítulos
        </p>
        <footer className="text-tinta-suave mt-10 font-sans text-xs">
          v{__APP_VERSION__} ·{' '}
          <a
            className="hover:text-primaria underline"
            href="https://github.com/edioilha/biblia-app"
          >
            código-fonte
          </a>
        </footer>
      </article>
    </main>
  );
}
