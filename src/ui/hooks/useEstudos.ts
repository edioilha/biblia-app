import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Versao } from '../../dominio/biblia';
import type { ConsultaEstudos } from '../../dominio/estudo';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';
import { useVersaoAtiva } from './useVersoes';

/** UC13 — página da aba e totais na versão ativa; mantém a anterior enquanto a nova chega. */
export function useEstudos(consulta: ConsultaEstudos, parametros: string) {
  const { listarEstudos } = useDependencias();
  const versao = useVersaoAtiva();
  return useQuery({
    queryKey: chaves.listaEstudos(versao?.id ?? null, parametros),
    // Só roda com a versão carregada (`enabled`).
    queryFn: () => listarEstudos.executar((versao as Versao).id, consulta),
    enabled: versao !== undefined,
    placeholderData: keepPreviousData,
  });
}
