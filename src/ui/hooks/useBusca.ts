import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ConsultaBusca } from '../../dominio/busca';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

function usePreparoOpcoes() {
  const { prepararBusca, versaoPadrao } = useDependencias();
  return {
    queryKey: chaves.preparoBusca(versaoPadrao.id),
    queryFn: async () => {
      await prepararBusca.executar();
      return true;
    },
  };
}

/** UC03 — o índice da versão está pronto? (`isPending` = "Preparando a busca…") */
export function usePreparoBusca() {
  return useQuery(usePreparoOpcoes());
}

/**
 * Prepara o índice em segundo plano quando o navegador estiver ocioso, para a primeira
 * busca ser rápida (RNF02). O trabalho pesado roda no Web Worker.
 */
export function usePreparoBuscaEmSegundoPlano() {
  const cliente = useQueryClient();
  const opcoes = usePreparoOpcoes();
  useEffect(() => {
    const iniciar = () => void cliente.prefetchQuery(opcoes);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(iniciar, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(iniciar, 1500);
    return () => clearTimeout(id);
    // Uma vez por montagem: a chave não muda durante a sessão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);
}

/** UC03 — página de resultados; mantém a anterior na tela enquanto a nova chega. */
export function useBuscaTexto(consulta: ConsultaBusca, parametros: string) {
  const { buscarTexto, versaoPadrao } = useDependencias();
  return useQuery({
    queryKey: chaves.busca(versaoPadrao.id, parametros),
    queryFn: () => buscarTexto.executar(consulta),
    enabled: consulta.pesquisavel,
    placeholderData: keepPreviousData,
  });
}
