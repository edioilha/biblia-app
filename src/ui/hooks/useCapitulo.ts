import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Referencia } from '../../dominio/biblia';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/**
 * Executa AbrirCapitulo para a referência. Mantém o capítulo anterior visível enquanto
 * o próximo carrega (sem "piscar"); respostas obsoletas são descartadas pelo TanStack Query.
 */
export function useCapitulo(ref: Referencia) {
  const { abrirCapitulo } = useDependencias();
  const consulta = useQuery({
    queryKey: chaves.capitulo(ref),
    queryFn: () => abrirCapitulo.executar(ref),
    placeholderData: keepPreviousData,
    // AbrirCapitulo também salva a última posição: ao voltar a um capítulo em cache,
    // exibe o cache na hora e reexecuta em segundo plano para registrar a posição.
    staleTime: 0,
  });

  return {
    aberto: consulta.data ?? null,
    erro: consulta.error,
    carregando: consulta.isPending || consulta.isPlaceholderData,
  };
}
