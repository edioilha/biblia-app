import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Referencia } from '../../dominio/biblia';
import type { Favorito } from '../../dominio/estudo';
import { invalidarMarcacoes } from '../consultas/clienteConsultas';
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
    onSettled: (_r, _e, versiculo) => invalidarMarcacoes(cliente, versiculo),
  });
}

/** UC13 A4 — remove um favorito pela lista de Meus Estudos. */
export function useRemoverFavorito() {
  const { removerFavorito } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (favorito: Favorito) => removerFavorito.executar(favorito.id),
    onSettled: (_r, _e, favorito) => invalidarMarcacoes(cliente, favorito.referencia),
  });
}
