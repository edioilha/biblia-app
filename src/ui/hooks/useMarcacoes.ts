import { useQuery } from '@tanstack/react-query';
import type { Capitulo } from '../../dominio/biblia';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from '../contexto/Dependencias';

/** Marcações do capítulo exibido, na versão dele (`undefined` enquanto carrega). */
export function useMarcacoes(capitulo: Capitulo | null) {
  const { obterMarcacoesDoCapitulo } = useDependencias();
  return useQuery({
    queryKey: capitulo
      ? chaves.marcacoesDaVersao(capitulo.versaoId, capitulo.referencia)
      : ['marcacoes', null],
    queryFn: () =>
      capitulo ? obterMarcacoesDoCapitulo.executar(capitulo.versaoId, capitulo.referencia) : null,
    enabled: capitulo !== null,
  }).data;
}
