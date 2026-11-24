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
  ExcluirAnotacao,
  ListarEstudos,
  MarcarTexto,
  ObterMarcacoesDoCapitulo,
  ObterPosicaoInicial,
  PrepararBusca,
  PrepararVersaoPadrao,
  RemoverDestaque,
  RemoverFavorito,
} from '../aplicacao/casos-de-uso';
import type { FonteVersaoEmbarcada } from '../aplicacao/portas';
import { Canon, Versao, VersaoId } from '../dominio/biblia';
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
  PreferenciasEmMemoria,
  RelogioFixo,
  TextoBiblicoEmMemoria,
} from './fakes';
import { BuscaEmMemoria } from './busca';

interface Opcoes {
  rota?: string;
  preferencias?: Preferencias | null;
  fonte?: FonteVersaoEmbarcada;
  favoritos?: FavoritosEmMemoria;
  destaques?: DestaquesEmMemoria;
  anotacoes?: AnotacoesEmMemoria;
  busca?: BuscaEmMemoria;
}

/** Monta o app completo com as portas em memória e um MemoryRouter. */
export function renderizarApp({
  rota = '/',
  preferencias = null,
  fonte,
  favoritos = new FavoritosEmMemoria(),
  anotacoes = new AnotacoesEmMemoria(),
  destaques = new DestaquesEmMemoria(anotacoes),
  busca = new BuscaEmMemoria(),
}: Opcoes = {}) {
  const canon = new Canon();
  const versao = new Versao(
    VersaoId.de('BLIVRE'),
    'Bíblia Livre',
    2018,
    'Domínio público',
    '',
    true,
  );
  const texto = new TextoBiblicoEmMemoria(canon);
  const prefs = new PreferenciasEmMemoria(preferencias);
  const relogio = new RelogioFixo();
  const gerador = new GeradorIdSequencial();
  const deps: Dependencias = {
    canon,
    versaoPadrao: versao,
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
    buscarTexto: new BuscarTexto(busca, versao.id),
    prepararBusca: new PrepararBusca(busca, versao.id),
    listarEstudos: new ListarEstudos(canon, texto, favoritos, destaques, anotacoes, versao.id),
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
  return { ...resultado, canon, prefs, texto, favoritos, destaques, anotacoes, busca };
}
