/**
 * Composition Root (ADR 0006).
 * Único ponto que conhece as implementações concretas: instancia os adapters
 * de infraestrutura e os injeta nos casos de uso. A UI consome apenas o que
 * é exportado daqui.
 */
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
} from './aplicacao/casos-de-uso';
import { Canon } from './dominio/biblia';
import {
  BancoApp,
  DexieAnotacaoRepository,
  DexieDestaqueRepository,
  DexieFavoritoRepository,
  DexieInscricaoRepository,
  DexiePreferenciasRepository,
  DexieTextoBiblicoRepository,
} from './infraestrutura/dexie';
import { ServicoBuscaWorker } from './infraestrutura/busca';
import { FonteBibliaData, FonteEstatica } from './infraestrutura/fontes';
import { PlanosPreDefinidos } from './infraestrutura/planos';
import { GeradorUuidV7, RelogioSistema } from './infraestrutura/sistema';
import { VersoesDisponiveis } from './infraestrutura/versoes';
import type { Dependencias } from './ui/contexto/Dependencias';

const canon = new Canon();
// ADR 0007: BLIVRE embarcada (RF07.1); TB e ALM1911 instaláveis (UC09).
const catalogo = new VersoesDisponiveis();
const padrao = catalogo.padrao();
const db = new BancoApp();
const texto = new DexieTextoBiblicoRepository(db, canon);
const preferencias = new DexiePreferenciasRepository(db, canon);
const favoritos = new DexieFavoritoRepository(db, canon);
const destaques = new DexieDestaqueRepository(db, canon);
const anotacoes = new DexieAnotacaoRepository(db, canon);
const inscricoes = new DexieInscricaoRepository(db);
const planos = new PlanosPreDefinidos(canon);
const relogio = new RelogioSistema();
const gerador = new GeradorUuidV7();
const fonte = new FonteEstatica(import.meta.env.BASE_URL);
const fonteInstalacao = new FonteBibliaData(canon);
// ADR 0005: índice e consultas num Web Worker (criado na primeira chamada).
const busca = new ServicoBuscaWorker(
  canon,
  () =>
    new Worker(new URL('./infraestrutura/busca/busca.worker.ts', import.meta.url), {
      type: 'module',
      name: 'busca',
    }),
);

const versaoAtiva = new ObterVersaoAtiva(catalogo, preferencias);

export const dependencias: Dependencias = {
  canon,
  abrirCapitulo: new AbrirCapitulo(canon, texto, preferencias, padrao.id),
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
  obterPosicaoInicial: new ObterPosicaoInicial(canon, preferencias),
  prepararVersaoPadrao: new PrepararVersaoPadrao(canon, fonte, texto, padrao.id),
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
  instalarVersao: new InstalarVersao(canon, catalogo, fonteInstalacao, texto, busca),
  trocarVersao: new TrocarVersao(canon, catalogo, texto, preferencias),
  removerVersao: new RemoverVersao(catalogo, texto, preferencias, busca),
};
