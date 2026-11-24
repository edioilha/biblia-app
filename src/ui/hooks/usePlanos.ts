import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Referencia } from '../../dominio/biblia';
import type { DataLocal, InscricaoPlano, PlanoId } from '../../dominio/planos';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/**
 * Os planos dependem do dia de hoje: ao voltar ao app (outro dia, talvez), relê. Por isso
 * estas consultas não usam o `staleTime: Infinity` padrão.
 */
const conformeODia = { staleTime: 0, refetchOnWindowFocus: true } as const;

/** UC08 — planos seguidos e catálogo. */
export function usePainelPlanos() {
  const { obterPainelPlanos } = useDependencias();
  return useQuery({
    queryKey: chaves.painelPlanos(),
    queryFn: () => obterPainelPlanos.executar(),
    ...conformeODia,
  });
}

/** Faixa da leitura: planos cuja leitura inclui o capítulo (`[]` enquanto carrega). */
export function useLeiturasDoCapitulo(capitulo: Referencia | null) {
  const { obterLeiturasDoCapitulo } = useDependencias();
  return (
    useQuery({
      queryKey: capitulo ? chaves.leiturasDoCapitulo(capitulo) : [...chaves.planos(), null],
      queryFn: () => (capitulo ? obterLeiturasDoCapitulo.executar(capitulo) : []),
      enabled: capitulo !== null,
      ...conformeODia,
    }).data ?? []
  );
}

/** Ações sobre planos (UC07/UC08). */
export type AcaoPlano =
  | { tipo: 'iniciar'; plano: PlanoId; inicio: DataLocal }
  | { tipo: 'marcar'; inscricao: InscricaoPlano; dia: number; concluido: boolean }
  | { tipo: 'reagendar'; inscricao: InscricaoPlano }
  | { tipo: 'encerrar'; inscricao: InscricaoPlano };

/** UC07/UC08 — inicia, conclui/desfaz dia, reagenda ou encerra; depois relê os planos. */
export function useEditarPlanos() {
  const { iniciarPlano, marcarDiaPlano, reagendarPlano, encerrarPlano } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (acao: AcaoPlano): Promise<void> => {
      switch (acao.tipo) {
        case 'iniciar':
          await iniciarPlano.executar(acao.plano, acao.inicio);
          return;
        case 'marcar':
          await marcarDiaPlano.executar(acao.inscricao.id, acao.dia, acao.concluido);
          return;
        case 'reagendar':
          await reagendarPlano.executar(acao.inscricao.id);
          return;
        case 'encerrar':
          await encerrarPlano.executar(acao.inscricao.id);
          return;
      }
    },
    onSettled: () => cliente.invalidateQueries({ queryKey: chaves.planos() }),
  });
}
