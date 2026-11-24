import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ConsultaEstudos } from '../../dominio/estudo';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** UC13 — página da aba e totais; mantém a anterior na tela enquanto a nova chega. */
export function useEstudos(consulta: ConsultaEstudos, parametros: string) {
  const { listarEstudos, versaoPadrao } = useDependencias();
  return useQuery({
    queryKey: chaves.listaEstudos(versaoPadrao.id, parametros),
    queryFn: () => listarEstudos.executar(consulta),
    placeholderData: keepPreviousData,
  });
}
