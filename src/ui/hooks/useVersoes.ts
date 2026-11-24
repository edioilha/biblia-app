import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VersaoId } from '../../dominio/biblia';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** UC10 — versão ativa (`undefined` só enquanto carrega). */
export function useVersaoAtiva() {
  const { obterVersaoAtiva } = useDependencias();
  return useQuery({
    queryKey: chaves.versaoAtiva(),
    queryFn: () => obterVersaoAtiva.executar(),
  }).data;
}

/** RF07.2 — versões do catálogo, instaladas ou não. */
export function useListaVersoes() {
  const { listarVersoes } = useDependencias();
  return useQuery({ queryKey: chaves.versoes(), queryFn: () => listarVersoes.executar() });
}

export interface AcaoVersao {
  tipo: 'trocar' | 'remover';
  versao: VersaoId;
}

/**
 * UC10 / RF07.5 — troca a versão ativa ou remove uma versão. Texto, busca, destaques e
 * Meus Estudos dependem da versão, então todo o cache é relido.
 */
export function useEditarVersoes() {
  const { trocarVersao, removerVersao } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (acao: AcaoVersao) =>
      acao.tipo === 'trocar'
        ? trocarVersao.executar(acao.versao)
        : removerVersao.executar(acao.versao),
    onSettled: () => cliente.invalidateQueries(),
  });
}
