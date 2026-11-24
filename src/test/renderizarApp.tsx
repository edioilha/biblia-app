import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  AbrirCapitulo,
  AlterarCorDestaque,
  AlternarFavorito,
  BuscarTexto,
  CriarAnotacao,
  DesmarcarTexto,
  EditarAnotacao,
  EncerrarPlano,
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
} from '../aplicacao/casos-de-uso';
import type { FonteVersao } from '../aplicacao/portas';
import { Canon } from '../dominio/biblia';
import type { Preferencias } from '../dominio/preferencias';
import { App } from '../ui/App';
import { criarClienteConsultas } from '../ui/consultas/clienteConsultas';
import { DependenciasProvider, type Dependencias } from '../ui/contexto/Dependencias';
import {
  AnotacoesEmMemoria,
  DestaquesEmMemoria,
  FavoritosEmMemoria,
  FonteSintetica,
  GeradorIdSequencial,
  InscricoesEmMemoria,
  PreferenciasEmMemoria,
  RelogioFixo,
  TextoBiblicoEmMemoria,
} from './fakes';
import { BuscaEmMemoria } from './busca';
import { PlanosPreDefinidos } from '../infraestrutura/planos';
import { VersoesDisponiveis } from '../infraestrutura/versoes';

interface Opcoes {
  rota?: string;
  preferencias?: Preferencias | null;
  fonte?: FonteVersao;
  /** Fonte da instalação de versões (UC09); por padrão, livros sintéticos com a sigla. */
  fonteInstalacao?: FonteVersao;
  favoritos?: FavoritosEmMemoria;
  destaques?: DestaquesEmMemoria;
  anotacoes?: AnotacoesEmMemoria;
  busca?: BuscaEmMemoria;
  inscricoes?: InscricoesEmMemoria;
  relogio?: RelogioFixo;
}

/** Monta o app completo com as portas em memória e um MemoryRouter. */
export function renderizarApp({
  rota = '/',
  preferencias = null,
  fonte,
  fonteInstalacao,
  favoritos = new FavoritosEmMemoria(),
  anotacoes = new AnotacoesEmMemoria(),
  destaques = new DestaquesEmMemoria(anotacoes),
  busca = new BuscaEmMemoria(),
  inscricoes = new InscricoesEmMemoria(),
  relogio = new RelogioFixo(),
}: Opcoes = {}) {
  const canon = new Canon();
  const catalogo = new VersoesDisponiveis();
  const versao = catalogo.padrao();
  const texto = new TextoBiblicoEmMemoria(canon);
  const prefs = new PreferenciasEmMemoria(preferencias);
  const planos = new PlanosPreDefinidos(canon);
  const gerador = new GeradorIdSequencial();
  const versaoAtiva = new ObterVersaoAtiva(catalogo, prefs);
  const instalacao = fonteInstalacao ?? new FonteSintetica(canon, { prefixo: true });
  const deps: Dependencias = {
    canon,
    abrirCapitulo: new AbrirCapitulo(canon, texto, prefs, versao.id),
    obterMarcacoesDoCapitulo: new ObterMarcacoesDoCapitulo(favoritos, destaques, anotacoes),
    alternarFavorito: new AlternarFavorito(favoritos, relogio, gerador),
    removerFavorito: new RemoverFavorito(favoritos),
    marcarTexto: new MarcarTexto(texto, destaques, relogio, gerador),
    desmarcarTexto: new DesmarcarTexto(texto, destaques, gerador),
    removerDestaque: new RemoverDestaque(destaques),
    alterarCorDestaque: new AlterarCorDestaque(texto, destaques, gerador),
    criarAnotacao: new CriarAnotacao(anotacoes, relogio, gerador),
    editarAnotacao: new EditarAnotacao(anotacoes, relogio),
    excluirAnotacao: new ExcluirAnotacao(anotacoes),
    obterPosicaoInicial: new ObterPosicaoInicial(canon, prefs),
    prepararVersaoPadrao: new PrepararVersaoPadrao(
      canon,
      fonte ?? new FonteSintetica(canon),
      texto,
      versao.id,
    ),
    buscarTexto: new BuscarTexto(busca),
    prepararBusca: new PrepararBusca(busca),
    listarEstudos: new ListarEstudos(canon, texto, favoritos, destaques, anotacoes),
    obterPainelPlanos: new ObterPainelPlanos(planos, inscricoes, relogio),
    iniciarPlano: new IniciarPlano(planos, inscricoes, gerador),
    marcarDiaPlano: new MarcarDiaPlano(inscricoes),
    reagendarPlano: new ReagendarPlano(inscricoes, relogio),
    encerrarPlano: new EncerrarPlano(inscricoes),
    obterLeiturasDoCapitulo: new ObterLeiturasDoCapitulo(planos, inscricoes, relogio),
    obterVersaoAtiva: versaoAtiva,
    listarVersoes: new ListarVersoes(catalogo, texto, versaoAtiva),
    instalarVersao: new InstalarVersao(canon, catalogo, instalacao, texto, busca),
    trocarVersao: new TrocarVersao(canon, catalogo, texto, prefs),
    removerVersao: new RemoverVersao(catalogo, texto, prefs, busca),
  };

  const resultado = render(
    <DependenciasProvider valor={deps}>
      <QueryClientProvider client={criarClienteConsultas()}>
        <MemoryRouter initialEntries={[rota]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </DependenciasProvider>,
  );
  return {
    ...resultado,
    canon,
    prefs,
    texto,
    favoritos,
    destaques,
    anotacoes,
    busca,
    inscricoes,
    relogio,
  };
}
