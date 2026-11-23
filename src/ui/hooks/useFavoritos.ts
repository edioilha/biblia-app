import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Referencia } from '../../dominio/biblia';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/**
 * UC04 — alterna o favorito de um versículo. A UI aplica a mudança de forma otimista a
 * partir de `variables` enquanto a mutação está pendente; ao terminar (sucesso ou erro),
 * recarrega as marcações do capítulo — a mutação só deixa de estar pendente depois disso.
 */
export function useAlternarFavorito() {
  const { alternarFavorito } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (versiculo: Referencia) => alternarFavorito.executar(versiculo),
    onSettled: (_r, _e, versiculo) =>
      cliente.invalidateQueries({ queryKey: chaves.marcacoes(versiculo) }),
  });
}
