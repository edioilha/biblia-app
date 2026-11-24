import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { VersaoCorrompidaError, type ProgressoInstalacao } from '../../aplicacao/casos-de-uso';
import type { Versao, VersaoId } from '../../dominio/biblia';
import { chaves } from '../consultas/clienteConsultas';
import { useDependencias } from './Dependencias';

export type EstadoInstalacao =
  | { readonly tipo: 'andamento'; readonly progresso: ProgressoInstalacao | null }
  | { readonly tipo: 'erro'; readonly mensagem: string };

interface Instalacoes {
  readonly estados: ReadonlyMap<VersaoId, EstadoInstalacao>;
  /** Última conclusão, falha ou cancelamento, para anunciar (aria-live). */
  readonly aviso: string;
  instalar(versao: Versao): void;
  cancelar(versao: VersaoId): void;
}

const InstalacoesContext = createContext<Instalacoes | null>(null);

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof VersaoCorrompidaError) {
    return 'Os arquivos da versão vieram com problema. Tente novamente mais tarde.';
  }
  return 'Não foi possível baixar a versão. Verifique a conexão e tente novamente.';
}

/**
 * UC09 — instalações em andamento. Fica acima das rotas: a instalação continua se o leitor
 * sair da tela Versões, e o progresso aparece ao voltar.
 */
export function InstalacoesProvider({ children }: { children: ReactNode }) {
  const { instalarVersao } = useDependencias();
  const cliente = useQueryClient();
  const [estados, setEstados] = useState<ReadonlyMap<VersaoId, EstadoInstalacao>>(new Map());
  const [aviso, setAviso] = useState('');
  const controles = useRef(new Map<VersaoId, AbortController>());

  const definir = useCallback((id: VersaoId, estado: EstadoInstalacao | null) => {
    setEstados((atual) => {
      const novo = new Map(atual);
      if (estado) novo.set(id, estado);
      else novo.delete(id);
      return novo;
    });
  }, []);

  const instalar = useCallback(
    (versao: Versao) => {
      if (controles.current.has(versao.id)) return;
      const controle = new AbortController();
      controles.current.set(versao.id, controle);
      definir(versao.id, { tipo: 'andamento', progresso: null });
      setAviso(`Instalando ${versao.nome}…`);

      instalarVersao
        .executar(versao.id, {
          sinal: controle.signal,
          aoProgredir: (progresso) => definir(versao.id, { tipo: 'andamento', progresso }),
        })
        .then(
          () => {
            definir(versao.id, null);
            setAviso(`${versao.nome} instalada.`);
          },
          (erro: unknown) => {
            if (controle.signal.aborted) {
              definir(versao.id, null);
              setAviso(`Instalação de ${versao.nome} cancelada.`);
            } else {
              definir(versao.id, { tipo: 'erro', mensagem: mensagemDeErro(erro) });
              setAviso(`Não foi possível instalar ${versao.nome}.`);
            }
          },
        )
        .finally(() => {
          controles.current.delete(versao.id);
          void cliente.invalidateQueries({ queryKey: chaves.versoes() });
        });
    },
    [instalarVersao, cliente, definir],
  );

  const cancelar = useCallback((id: VersaoId) => controles.current.get(id)?.abort(), []);

  const valor = useMemo(
    () => ({ estados, aviso, instalar, cancelar }),
    [estados, aviso, instalar, cancelar],
  );
  return <InstalacoesContext.Provider value={valor}>{children}</InstalacoesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook acoplado ao provider
export function useInstalacoes(): Instalacoes {
  const valor = useContext(InstalacoesContext);
  if (!valor) throw new Error('useInstalacoes fora de InstalacoesProvider.');
  return valor;
}
