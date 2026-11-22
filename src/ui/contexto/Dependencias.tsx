import { createContext, useContext, type ReactNode } from 'react';
import type {
  AbrirCapitulo,
  ObterPosicaoInicial,
  PrepararVersaoPadrao,
} from '../../aplicacao/casos-de-uso';
import type { Canon, Versao } from '../../dominio/biblia';

/** Dependências que a UI recebe do Composition Root (src/container.ts). */
export interface Dependencias {
  readonly canon: Canon;
  readonly versaoPadrao: Versao;
  readonly abrirCapitulo: AbrirCapitulo;
  readonly obterPosicaoInicial: ObterPosicaoInicial;
  readonly prepararVersaoPadrao: PrepararVersaoPadrao;
}

const DependenciasContext = createContext<Dependencias | null>(null);

export function DependenciasProvider({
  valor,
  children,
}: {
  valor: Dependencias;
  children: ReactNode;
}) {
  return <DependenciasContext value={valor}>{children}</DependenciasContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook acoplado ao provider
export function useDependencias(): Dependencias {
  const deps = useContext(DependenciasContext);
  if (!deps) throw new Error('useDependencias deve ser usado dentro de <DependenciasProvider>.');
  return deps;
}
