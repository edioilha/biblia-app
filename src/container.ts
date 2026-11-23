/**
 * Composition Root (ADR 0006).
 * Único ponto que conhece as implementações concretas: instancia os adapters
 * de infraestrutura e os injeta nos casos de uso. A UI consome apenas o que
 * é exportado daqui.
 */
import {
  AbrirCapitulo,
  AlternarFavorito,
  ObterMarcacoesDoCapitulo,
  ObterPosicaoInicial,
  PrepararVersaoPadrao,
} from './aplicacao/casos-de-uso';
import { Canon, Versao, VersaoId } from './dominio/biblia';
import {
  BancoApp,
  DexieFavoritoRepository,
  DexiePreferenciasRepository,
  DexieTextoBiblicoRepository,
} from './infraestrutura/dexie';
import { FonteEstatica } from './infraestrutura/fontes';
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
const fonte = new FonteEstatica(import.meta.env.BASE_URL);

export const dependencias: Dependencias = {
  canon,
  versaoPadrao: BLIVRE,
  abrirCapitulo: new AbrirCapitulo(canon, texto, preferencias, BLIVRE.id),
  obterMarcacoesDoCapitulo: new ObterMarcacoesDoCapitulo(favoritos),
  alternarFavorito: new AlternarFavorito(favoritos, new RelogioSistema(), new GeradorUuidV7()),
  obterPosicaoInicial: new ObterPosicaoInicial(canon, preferencias),
  prepararVersaoPadrao: new PrepararVersaoPadrao(canon, fonte, texto, BLIVRE.id),
};
