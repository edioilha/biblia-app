import { createContext, useContext, type ReactNode } from 'react';
import type {
  AbrirCapitulo,
  AlterarCorDestaque,
  AlternarFavorito,
  BuscarTexto,
  ConfigurarLeitura,
  CriarAnotacao,
  DesmarcarTexto,
  EditarAnotacao,
  EncerrarPlano,
  ExportarDados,
  ImportarDados,
  IniciarPlano,
  MarcarDiaPlano,
  ObterLeiturasDoCapitulo,
  ObterPainelPlanos,
  ReagendarPlano,
  ExcluirAnotacao,
  InstalarVersao,
  ListarEstudos,
  ListarVersoes,
  ObterVersaoAtiva,
  RemoverVersao,
  TrocarVersao,
  MarcarTexto,
  ObterMarcacoesDoCapitulo,
  ObterPosicaoInicial,
  PrepararBusca,
  PrepararVersaoPadrao,
  RemoverDestaque,
  RemoverFavorito,
} from '../../aplicacao/casos-de-uso';
import type { Canon } from '../../dominio/biblia';

/** Dependências que a UI recebe do Composition Root (src/container.ts). */
export interface Dependencias {
  readonly canon: Canon;
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
  readonly obterPainelPlanos: ObterPainelPlanos;
  readonly iniciarPlano: IniciarPlano;
  readonly marcarDiaPlano: MarcarDiaPlano;
  readonly reagendarPlano: ReagendarPlano;
  readonly encerrarPlano: EncerrarPlano;
  readonly obterLeiturasDoCapitulo: ObterLeiturasDoCapitulo;
  readonly obterVersaoAtiva: ObterVersaoAtiva;
  readonly listarVersoes: ListarVersoes;
  readonly instalarVersao: InstalarVersao;
  readonly trocarVersao: TrocarVersao;
  readonly removerVersao: RemoverVersao;
  readonly exportarDados: ExportarDados;
  readonly importarDados: ImportarDados;
  readonly configurarLeitura: ConfigurarLeitura;
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
