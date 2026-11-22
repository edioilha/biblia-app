import { QueryClient } from '@tanstack/react-query';
import type { Referencia } from '../../dominio/biblia';

/**
 * Cliente do TanStack Query (ADR 0002). Os dados são locais (IndexedDB), então:
 * - `networkMode: 'always'`: nunca pausa por falta de rede (offline-first, ADR 0003);
 * - `staleTime: Infinity`: só mudam pelas próprias mutações, que invalidam o cache;
 * - sem retry: falha local não é transitória.
 */
export function criarClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}

/** Chaves de cache: um lugar só, para leitura e invalidação usarem a mesma chave. */
export const chaves = {
  capitulo: (ref: Referencia) => ['capitulo', ref.chave()] as const,
  marcacoes: (ref: Referencia) => ['marcacoes', ref.doCapitulo().chave()] as const,
};
