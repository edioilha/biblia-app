import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VersaoId } from '../../dominio/biblia';
import type { CorDestaque, Destaque, IntervaloTexto } from '../../dominio/estudo';
import { invalidarMarcacoes } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** Ações do marca-texto (UC05). */
export type AcaoDestaque =
  | { tipo: 'marcar'; versao: VersaoId; trecho: IntervaloTexto; cor: CorDestaque }
  | { tipo: 'desmarcar'; versao: VersaoId; trecho: IntervaloTexto }
  | { tipo: 'remover'; destaque: Destaque }
  | { tipo: 'cor'; destaque: Destaque; cor: CorDestaque };

/**
 * UC05 — marca, desmarca, remove ou muda a cor. Sem atualização otimista: a gravação é
 * local e rápida, e o resultado (fusões e cortes) só é conhecido depois das regras.
 * Ao terminar, recarrega as marcações do capítulo.
 */
export function useEditarDestaques() {
  const { marcarTexto, desmarcarTexto, removerDestaque, alterarCorDestaque } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (acao: AcaoDestaque): Promise<void> => {
      switch (acao.tipo) {
        case 'marcar':
          await marcarTexto.executar(acao.versao, acao.trecho, acao.cor);
          return;
        case 'desmarcar':
          await desmarcarTexto.executar(acao.versao, acao.trecho);
          return;
        case 'remover':
          await removerDestaque.executar(acao.destaque.id);
          return;
        case 'cor':
          await alterarCorDestaque.executar(acao.destaque.id, acao.cor);
          return;
      }
    },
    onSettled: (_r, _e, acao) =>
      invalidarMarcacoes(cliente, 'trecho' in acao ? acao.trecho.capitulo : acao.destaque.capitulo),
  });
}
