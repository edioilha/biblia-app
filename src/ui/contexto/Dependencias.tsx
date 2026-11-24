import { createContext, useContext, type ReactNode } from 'react';
import type {
  AbrirCapitulo,
  AlterarCorDestaque,
  AlternarFavorito,
  BuscarTexto,
  CriarAnotacao,
  DesmarcarTexto,
  EditarAnotacao,
  ExcluirAnotacao,
  ListarEstudos,
  MarcarTexto,
  ObterMarcacoesDoCapitulo,
  ObterPosicaoInicial,
  PrepararBusca,
  PrepararVersaoPadrao,
  RemoverDestaque,
  RemoverFavorito,
} from '../../aplicacao/casos-de-uso';
import type { Canon, Versao } from '../../dominio/biblia';

/** Dependências que a UI recebe do Composition Root (src/container.ts). */
export interface Dependencias {
  readonly canon: Canon;
  readonly versaoPadrao: Versao;
  readonly abrirCapitulo: AbrirCapitulo;
  readonly obterMarcacoesDoCapitulo: ObterMarcacoesDoCapitulo;
  readonly alternarFavorito: AlternarFavorito;
  readonly removerFavorito: RemoverFavorito;
  readonly marcarTexto: MarcarTexto;
  readonly desmarcarTexto: DesmarcarTexto;
  readonly removerDestaque: RemoverDestaque;
  readonly alterarCorDestaque: AlterarCorDestaque;
  readonly criarAnotacao: CriarAnotacao;
  readonly editarAnotacao: EditarAnotacao;
  readonly excluirAnotacao: ExcluirAnotacao;
  readonly obterPosicaoInicial: ObterPosicaoInicial;
  readonly prepararVersaoPadrao: PrepararVersaoPadrao;
  readonly buscarTexto: BuscarTexto;
  readonly prepararBusca: PrepararBusca;
  readonly listarEstudos: ListarEstudos;
}

const DependenciasContext = createContext<Dependencias | null>(null);

export function DependenciasProvider({
  valor,
  children,
}: {
  valor: Dependencias;
  children: ReactNode;
}) {
  return <DependenciasContext value={valor}>{children}</DependenciasContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook acoplado ao provider
export function useDependencias(): Dependencias {
  const deps = useContext(DependenciasContext);
  if (!deps) throw new Error('useDependencias deve ser usado dentro de <DependenciasProvider>.');
  return deps;
}
