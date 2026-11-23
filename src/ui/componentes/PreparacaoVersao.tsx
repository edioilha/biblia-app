import { useEffect, useState, type ReactNode } from 'react';
import type { ProgressoPreparacao } from '../../aplicacao/casos-de-uso';
import { useDependencias } from '../contexto/Dependencias';
import { usePreparoBuscaEmSegundoPlano } from '../hooks/useBusca';
import { TelaPreparacao } from './TelaPreparacao';

type Estado =
  | { tipo: 'verificando' }
  | { tipo: 'importando'; progresso: ProgressoPreparacao | null }
  | { tipo: 'erro'; erro: Error }
  | { tipo: 'pronta' };

/** Garante a pré-condição de UC01 (versão instalada) antes de renderizar o app. */
export function PreparacaoVersao({ children }: { children: ReactNode }) {
  const { prepararVersaoPadrao } = useDependencias();
  const [estado, setEstado] = useState<Estado>({ tipo: 'verificando' });
  const [tentativa, setTentativa] = useState(0);

  // Sem flag de cancelamento de propósito: em StrictMode o effect roda duas vezes e o
  // caso de uso reaproveita a 1ª importação — é o callback dela que recebe o progresso.
  useEffect(() => {
    const atualizar = setEstado;
    void (async () => {
      try {
        if (await prepararVersaoPadrao.necessaria()) {
          atualizar({ tipo: 'importando', progresso: null });
          await prepararVersaoPadrao.executar((progresso) =>
            atualizar({ tipo: 'importando', progresso }),
          );
        }
        atualizar({ tipo: 'pronta' });
      } catch (erro) {
        atualizar({ tipo: 'erro', erro: erro instanceof Error ? erro : new Error(String(erro)) });
      }
    })();
  }, [prepararVersaoPadrao, tentativa]);

  switch (estado.tipo) {
    case 'pronta':
      return <ComBuscaEmPreparo>{children}</ComBuscaEmPreparo>;
    case 'verificando':
      return null;
    case 'importando':
      return <TelaPreparacao progresso={estado.progresso} erro={null} />;
    case 'erro':
      return (
        <TelaPreparacao
          progresso={null}
          erro={estado.erro}
          aoTentarNovamente={() => setTentativa((t) => t + 1)}
        />
      );
  }
}

/** Com a versão pronta, o índice de busca (UC03) é montado em segundo plano. */
function ComBuscaEmPreparo({ children }: { children: ReactNode }) {
  usePreparoBuscaEmSegundoPlano();
  return children;
}
