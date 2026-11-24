import { QueryClient } from '@tanstack/react-query';
import type { Referencia, VersaoId } from '../../dominio/biblia';

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
  /** Prefixo: invalida as marcações do capítulo em todas as versões. */
  marcacoes: (ref: Referencia) => ['marcacoes', ref.doCapitulo().chave()] as const,
  marcacoesDaVersao: (versao: VersaoId, ref: Referencia) =>
    [...chaves.marcacoes(ref), versao] as const,
  /** UC03 — índice da versão pronto (o preparo roda uma vez por sessão). */
  preparoBusca: (versao: VersaoId) => ['busca-preparo', versao] as const,
  /** UC03 — uma página de resultados; `parametros` = estado da busca na URL. */
  busca: (versao: VersaoId, parametros: string) => ['busca', versao, parametros] as const,
  /** UC13 — prefixo: invalida todas as listas de Meus Estudos. */
  estudos: () => ['estudos'] as const,
  /** UC13 — uma página de Meus Estudos; `parametros` = estado da tela na URL. */
  listaEstudos: (versao: VersaoId, parametros: string) =>
    [...chaves.estudos(), versao, parametros] as const,
  /** UC07/UC08 — prefixo: invalida o painel e as faixas da leitura. */
  planos: () => ['planos'] as const,
  painelPlanos: () => [...chaves.planos(), 'painel'] as const,
  leiturasDoCapitulo: (ref: Referencia) =>
    [...chaves.planos(), 'capitulo', ref.doCapitulo().chave()] as const,
};

/**
 * Depois de mudar favoritos, destaques ou anotações: recarrega as marcações do capítulo
 * e as listas de Meus Estudos (as duas telas mostram os mesmos dados).
 */
export function invalidarMarcacoes(cliente: QueryClient, ref: Referencia): Promise<void> {
  return Promise.all([
    cliente.invalidateQueries({ queryKey: chaves.marcacoes(ref) }),
    cliente.invalidateQueries({ queryKey: chaves.estudos() }),
  ]).then(() => undefined);
}
