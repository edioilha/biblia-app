import { CodigoLivro, type Canon } from '../dominio/biblia';
import { AbaEstudos, ConsultaEstudos, OrdemEstudos } from '../dominio/estudo';

/**
 * Estado de Meus Estudos, guardado na URL (#/estudos?aba=anotacoes&q=luz&p=2), como na
 * busca: voltar da leitura restaura aba, filtros e página. Valores padrão não aparecem na
 * URL; valores inválidos são ignorados.
 */
export interface EstadoEstudos {
  readonly aba: AbaEstudos;
  readonly q: string;
  /** Código USFM ("JHN") ou `null` = todos os livros. */
  readonly livro: string | null;
  readonly ordem: OrdemEstudos;
  readonly pagina: number;
}

const ABA_NA_URL: Record<AbaEstudos, string> = {
  FAVORITOS: 'favoritos',
  DESTAQUES: 'destaques',
  ANOTACOES: 'anotacoes',
};
const ORDEM_NA_URL: Record<OrdemEstudos, string> = { BIBLICA: 'biblica', RECENTES: 'recentes' };

export const ESTADO_INICIAL_ESTUDOS: EstadoEstudos = {
  aba: AbaEstudos.padrao,
  q: '',
  livro: null,
  ordem: OrdemEstudos.padrao,
  pagina: 1,
};

const chaveDe = <T extends string>(mapa: Record<T, string>, valor: string | null) =>
  (Object.keys(mapa) as T[]).find((k) => mapa[k] === valor);

export function estadoEstudosDaUrl(params: URLSearchParams, canon: Canon): EstadoEstudos {
  const livro = params.get('livro')?.trim().toUpperCase() ?? '';
  const p = params.get('p');
  return {
    aba: chaveDe(ABA_NA_URL, params.get('aba')) ?? AbaEstudos.padrao,
    q: params.get('q') ?? '',
    livro: canon.livros().some((l) => l.codigo.valor === livro) ? livro : null,
    ordem: chaveDe(ORDEM_NA_URL, params.get('ordem')) ?? OrdemEstudos.padrao,
    pagina: p && /^\d+$/.test(p) ? Math.max(1, Number(p)) : 1,
  };
}

export function parametrosEstudos(e: EstadoEstudos): URLSearchParams {
  const p = new URLSearchParams();
  if (e.aba !== AbaEstudos.padrao) p.set('aba', ABA_NA_URL[e.aba]);
  if (e.q) p.set('q', e.q);
  if (e.livro) p.set('livro', e.livro);
  if (e.ordem !== OrdemEstudos.padrao) p.set('ordem', ORDEM_NA_URL[e.ordem]);
  if (e.pagina > 1) p.set('p', String(e.pagina));
  return p;
}

/** Caminho de Meus Estudos: /estudos ou /estudos?aba=… */
export function caminhoEstudos(mudancas: Partial<EstadoEstudos> = {}): string {
  const p = parametrosEstudos({ ...ESTADO_INICIAL_ESTUDOS, ...mudancas }).toString();
  return p ? `/estudos?${p}` : '/estudos';
}

export function consultaEstudosDoEstado(e: EstadoEstudos): ConsultaEstudos {
  return ConsultaEstudos.criar({
    aba: e.aba,
    texto: e.q,
    livro: e.livro ? CodigoLivro.de(e.livro) : null,
    ordem: e.ordem,
    pagina: e.pagina,
  });
}
