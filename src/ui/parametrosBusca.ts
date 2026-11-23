import { CodigoLivro, type Canon, type Livro, type Testamento } from '../dominio/biblia';
import {
  ConsultaBusca,
  FiltroBusca,
  ModoBusca,
  Ordenacao,
  TAMANHO_PAGINA_PADRAO,
  TAMANHOS_PAGINA,
} from '../dominio/busca';

/**
 * Estado da tela de busca, guardado na URL (#/buscar?q=amor&t=NT&p=2): voltar de um
 * resultado restaura a busca e a página, e o link pode ser compartilhado. Valores padrão
 * não aparecem na URL; valores inválidos são ignorados.
 */
export interface EstadoBusca {
  readonly q: string;
  readonly modo: ModoBusca;
  readonly testamento: Testamento | null;
  readonly livros: readonly string[];
  readonly aproximada: boolean;
  readonly ordem: Ordenacao;
  readonly pagina: number;
  readonly tamanho: number;
}

const MODO_NA_URL: Record<ModoBusca, string | null> = {
  TODAS_PALAVRAS: null,
  QUALQUER_PALAVRA: 'qualquer',
  FRASE_EXATA: 'frase',
};
const TESTAMENTO_NA_URL: Record<Testamento, string> = { ANTIGO: 'AT', NOVO: 'NT' };

export const ESTADO_INICIAL: EstadoBusca = {
  q: '',
  modo: ModoBusca.padrao,
  testamento: null,
  livros: [],
  aproximada: false,
  ordem: Ordenacao.padrao,
  pagina: 1,
  tamanho: TAMANHO_PAGINA_PADRAO,
};

const inteiro = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null);

export function estadoDaUrl(params: URLSearchParams, canon: Canon): EstadoBusca {
  const modo = (Object.keys(MODO_NA_URL) as ModoBusca[]).find(
    (m) => MODO_NA_URL[m] !== null && MODO_NA_URL[m] === params.get('modo'),
  );
  const t = params.get('t');
  const testamento =
    (Object.keys(TESTAMENTO_NA_URL) as Testamento[]).find((x) => TESTAMENTO_NA_URL[x] === t) ??
    null;
  const codigos = new Set<string>(canon.livros().map((l) => l.codigo.valor));
  const livros = (params.get('livros') ?? '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c, i, todos) => codigos.has(c) && todos.indexOf(c) === i);
  const tamanho = inteiro(params.get('n'));
  return {
    q: params.get('q') ?? '',
    modo: modo ?? ModoBusca.padrao,
    testamento,
    livros: livrosDoTestamento(livros, testamento, canon),
    aproximada: params.get('aprox') === '1',
    ordem: params.get('ordem') === 'biblica' ? 'CANONICA' : 'RELEVANCIA',
    pagina: Math.max(1, inteiro(params.get('p')) ?? 1),
    tamanho: TAMANHOS_PAGINA.find((n) => n === tamanho) ?? TAMANHO_PAGINA_PADRAO,
  };
}

export function parametrosDoEstado(e: EstadoBusca): URLSearchParams {
  const p = new URLSearchParams();
  if (e.q) p.set('q', e.q);
  const modo = MODO_NA_URL[e.modo];
  if (modo) p.set('modo', modo);
  if (e.testamento) p.set('t', TESTAMENTO_NA_URL[e.testamento]);
  if (e.livros.length) p.set('livros', e.livros.join(','));
  if (e.aproximada) p.set('aprox', '1');
  if (e.ordem === 'CANONICA') p.set('ordem', 'biblica');
  if (e.pagina > 1) p.set('p', String(e.pagina));
  if (e.tamanho !== TAMANHO_PAGINA_PADRAO) p.set('n', String(e.tamanho));
  return p;
}

/** Caminho da busca: /buscar ou /buscar?q=… */
export function caminhoBusca(e: EstadoBusca): string {
  const p = parametrosDoEstado(e).toString();
  return p ? `/buscar?${p}` : '/buscar';
}

export function consultaDoEstado(e: EstadoBusca, canon: Canon): ConsultaBusca {
  return ConsultaBusca.interpretar(e.q, {
    modo: e.modo,
    filtro: FiltroBusca.de(e.testamento, livrosDoEstado(e, canon)),
    fuzzy: e.aproximada,
    ordenacao: e.ordem,
    pagina: e.pagina,
    tamanhoPagina: e.tamanho,
  });
}

export function livrosDoEstado(e: EstadoBusca, canon: Canon): Livro[] {
  return e.livros.map((c) => canon.livro(CodigoLivro.de(c)));
}

/** Livros do testamento escolhido (os demais saem do filtro). */
export function livrosDoTestamento(
  livros: readonly string[],
  testamento: Testamento | null,
  canon: Canon,
): string[] {
  return livros.filter(
    (c) => testamento === null || canon.livro(CodigoLivro.de(c)).testamento === testamento,
  );
}

/** RF02.7 — números da paginação: primeira, última, vizinhas da atual e reticências. */
export function paginasVisiveis(atual: number, total: number): (number | '…')[] {
  const numeros = [...new Set([1, atual - 1, atual, atual + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const saida: (number | '…')[] = [];
  for (const n of numeros) {
    const anterior = saida.at(-1);
    if (typeof anterior === 'number' && n - anterior === 2) saida.push(anterior + 1);
    else if (typeof anterior === 'number' && n - anterior > 2) saida.push('…');
    saida.push(n);
  }
  return saida;
}
