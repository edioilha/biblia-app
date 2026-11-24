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
  ListarEstudos,
  MarcarTexto,
  ObterMarcacoesDoCapitulo,
  ObterPosicaoInicial,
  PrepararBusca,
  PrepararVersaoPadrao,
  RemoverDestaque,
  RemoverFavorito,
} from './aplicacao/casos-de-uso';
import { Canon, Versao, VersaoId } from './dominio/biblia';
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
import { FonteEstatica } from './infraestrutura/fontes';
import { PlanosPreDefinidos } from './infraestrutura/planos';
import { GeradorUuidV7, RelogioSistema } from './infraestrutura/sistema';
import type { Dependencias } from './ui/contexto/Dependencias';

/** Versão embarcada (ADR 0007, RF07.1). */
const BLIVRE = new Versao(
  VersaoId.de('BLIVRE'),
  'Bíblia Livre',
  2018,
  'Domínio público',
  'https://github.com/Projeto-Euaggelion/biblia.data',
  true,
);

const canon = new Canon();
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
// ADR 0005: índice e consultas num Web Worker (criado na primeira chamada).
const busca = new ServicoBuscaWorker(
  canon,
  () =>
    new Worker(new URL('./infraestrutura/busca/busca.worker.ts', import.meta.url), {
      type: 'module',
      name: 'busca',
    }),
);

export const dependencias: Dependencias = {
  canon,
  versaoPadrao: BLIVRE,
  abrirCapitulo: new AbrirCapitulo(canon, texto, preferencias, BLIVRE.id),
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
  prepararVersaoPadrao: new PrepararVersaoPadrao(canon, fonte, texto, BLIVRE.id),
  buscarTexto: new BuscarTexto(busca, BLIVRE.id),
  prepararBusca: new PrepararBusca(busca, BLIVRE.id),
  listarEstudos: new ListarEstudos(canon, texto, favoritos, destaques, anotacoes, BLIVRE.id),
  obterPainelPlanos: new ObterPainelPlanos(planos, inscricoes, relogio),
  iniciarPlano: new IniciarPlano(planos, inscricoes, gerador),
  marcarDiaPlano: new MarcarDiaPlano(inscricoes),
  reagendarPlano: new ReagendarPlano(inscricoes, relogio),
  encerrarPlano: new EncerrarPlano(inscricoes),
  obterLeiturasDoCapitulo: new ObterLeiturasDoCapitulo(planos, inscricoes, relogio),
};
