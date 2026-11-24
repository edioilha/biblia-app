import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Versao } from '../../dominio/biblia';
import type { ConsultaBusca } from '../../dominio/busca';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';
import { useVersaoAtiva } from './useVersoes';

function usePreparoOpcoes(versao: Versao | undefined) {
  const { prepararBusca } = useDependencias();
  return {
    queryKey: chaves.preparoBusca(versao?.id ?? null),
    queryFn: async () => {
      if (versao) await prepararBusca.executar(versao.id);
      return true;
    },
    enabled: versao !== undefined,
  };
}

/** UC03 — o índice da versão ativa está pronto? (`isPending` = "Preparando a busca…") */
export function usePreparoBusca() {
  return useQuery(usePreparoOpcoes(useVersaoAtiva()));
}

/**
 * Prepara o índice da versão ativa em segundo plano quando o navegador estiver ocioso,
 * para a primeira busca ser rápida (RNF02). O trabalho pesado roda no Web Worker.
 */
export function usePreparoBuscaEmSegundoPlano() {
  const cliente = useQueryClient();
  const versao = useVersaoAtiva();
  const opcoes = usePreparoOpcoes(versao);
  useEffect(() => {
    if (!versao) return;
    const iniciar = () => void cliente.prefetchQuery(opcoes);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(iniciar, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(iniciar, 1500);
    return () => clearTimeout(id);
    // Uma vez por versão ativa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, versao?.id]);
}

/** UC03 — página de resultados; mantém a anterior na tela enquanto a nova chega. */
export function useBuscaTexto(consulta: ConsultaBusca, parametros: string) {
  const { buscarTexto } = useDependencias();
  const versao = useVersaoAtiva();
  return useQuery({
    queryKey: chaves.busca(versao?.id ?? null, parametros),
    // Só roda com a versão carregada (`enabled`).
    queryFn: () => buscarTexto.executar((versao as Versao).id, consulta),
    enabled: consulta.pesquisavel && versao !== undefined,
    placeholderData: keepPreviousData,
  });
}
