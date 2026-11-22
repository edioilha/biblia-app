import { useEffect, useState } from 'react';
import type { CapituloAberto } from '../../aplicacao/casos-de-uso';
import type { Referencia } from '../../dominio/biblia';
import { useDependencias } from '../contexto/Dependencias';

interface Estado {
  /** Chave da referência a que `aberto`/`erro` se referem. */
  chave: string | null;
  aberto: CapituloAberto | null;
  erro: Error | null;
}

/**
 * Executa AbrirCapitulo para a referência — que deve ser estável entre renders (useMemo).
 * Mantém o capítulo anterior visível enquanto o próximo carrega (sem "piscar")
 * e ignora respostas obsoletas.
 */
export function useCapitulo(ref: Referencia | null) {
  const { abrirCapitulo } = useDependencias();
  const [estado, setEstado] = useState<Estado>({ chave: null, aberto: null, erro: null });
  const chave = ref?.chave() ?? null;

  useEffect(() => {
    if (!ref) return;
    let ativo = true;
    abrirCapitulo.executar(ref).then(
      (aberto) => ativo && setEstado({ chave: ref.chave(), aberto, erro: null }),
      (erro: unknown) =>
        ativo &&
        setEstado((e) => ({
          ...e,
          chave: ref.chave(),
          erro: erro instanceof Error ? erro : new Error(String(erro)),
        })),
    );
    return () => {
      ativo = false;
    };
  }, [abrirCapitulo, ref]);

  return {
    aberto: estado.aberto,
    erro: estado.chave === chave ? estado.erro : null,
    carregando: estado.chave !== chave,
  };
}
