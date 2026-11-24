import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AlvoAnotacao } from '../../aplicacao/casos-de-uso';
import type { Anotacao, ModoExibicao } from '../../dominio/estudo';
import { invalidarMarcacoes } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** Ações sobre anotações (UC06). */
export type AcaoAnotacao =
  | { tipo: 'criar'; alvo: AlvoAnotacao; conteudo: string; exibicao: ModoExibicao }
  | { tipo: 'editar'; anotacao: Anotacao; conteudo: string; exibicao: ModoExibicao }
  | { tipo: 'excluir'; anotacao: Anotacao };

/** UC06 — cria, edita ou exclui; ao terminar, recarrega as marcações e Meus Estudos. */
export function useEditarAnotacoes() {
  const { criarAnotacao, editarAnotacao, excluirAnotacao } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (acao: AcaoAnotacao): Promise<void> => {
      switch (acao.tipo) {
        case 'criar':
          await criarAnotacao.executar(acao.alvo, acao.conteudo, acao.exibicao);
          return;
        case 'editar':
          await editarAnotacao.executar(acao.anotacao.id, acao.conteudo, acao.exibicao);
          return;
        case 'excluir':
          await excluirAnotacao.executar(acao.anotacao.id);
          return;
      }
    },
    onSettled: (_r, _e, acao) =>
      invalidarMarcacoes(
        cliente,
        acao.tipo === 'criar' ? acao.alvo.versiculo : acao.anotacao.referencia,
      ),
  });
}
