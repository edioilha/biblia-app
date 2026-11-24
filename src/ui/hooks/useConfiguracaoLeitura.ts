import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConfiguracaoLeitura } from '../../dominio/preferencias';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** UC12 — tema e tamanho da fonte (`undefined` só enquanto carrega). */
export function useConfiguracaoLeitura() {
  const { configurarLeitura } = useDependencias();
  return useQuery({
    queryKey: chaves.configuracaoLeitura(),
    queryFn: () => configurarLeitura.obter(),
  }).data;
}

/**
 * UC12 — muda o tema ou o tamanho. Otimista: a tela muda na hora; se não salvar, volta ao
 * que estava gravado.
 */
export function useConfigurarLeitura() {
  const { configurarLeitura } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (leitura: ConfiguracaoLeitura) => configurarLeitura.executar(leitura),
    onMutate: (leitura) => cliente.setQueryData(chaves.configuracaoLeitura(), leitura),
    onError: () => cliente.invalidateQueries({ queryKey: chaves.configuracaoLeitura() }),
  });
}
