import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDependencias } from '../contexto/Dependencias';

/** UC11 — gera o arquivo de backup (o download fica com a tela). */
export function useExportarBackup() {
  const { exportarDados } = useDependencias();
  return useMutation({ mutationFn: () => exportarDados.executar() });
}

/** UC11 — lê o arquivo escolhido e mostra o que acontecerá ao juntar (não grava). */
export function useAnalisarBackup() {
  const { importarDados } = useDependencias();
  return useMutation({ mutationFn: (conteudo: string) => importarDados.analisar(conteudo) });
}

/** UC11 — junta o arquivo aos dados do aparelho. Tudo pode ter mudado: relê o cache todo. */
export function useImportarBackup() {
  const { importarDados } = useDependencias();
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (conteudo: string) => importarDados.executar(conteudo),
    onSuccess: () => cliente.invalidateQueries(),
  });
}
