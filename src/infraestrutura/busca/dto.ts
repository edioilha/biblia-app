import { CodigoLivro, Referencia, type Canon, type Testamento } from '../../dominio/biblia';
import {
  ConsultaBusca,
  FiltroBusca,
  Pagina,
  type ModoBusca,
  type Ocorrencia,
  type Ordenacao,
  type ResultadoBusca,
} from '../../dominio/busca';

/**
 * Formatos que atravessam o `postMessage` do Web Worker (structured clone não preserva
 * classes): consulta e página viram objetos simples e são remontados do outro lado.
 */
export interface ConsultaDTO {
  termo: string;
  modo: ModoBusca;
  testamento: Testamento | null;
  livros: string[];
  fuzzy: boolean;
  ordenacao: Ordenacao;
  pagina: number;
  tamanhoPagina: number;
}

export interface PaginaDTO {
  itens: { chave: string; texto: string; ocorrencias: Ocorrencia[]; pontuacao: number }[];
  pagina: number;
  tamanhoPagina: number;
  total: number;
}

export function consultaParaDTO(c: ConsultaBusca): ConsultaDTO {
  return {
    termo: c.termo,
    modo: c.modo,
    testamento: c.filtro.testamento,
    livros: c.filtro.livros.map((l) => l.valor),
    fuzzy: c.fuzzy,
    ordenacao: c.ordenacao,
    pagina: c.pagina,
    tamanhoPagina: c.tamanhoPagina,
  };
}

export function consultaDeDTO(d: ConsultaDTO, canon: Canon): ConsultaBusca {
  return ConsultaBusca.interpretar(d.termo, {
    modo: d.modo,
    filtro: FiltroBusca.de(
      d.testamento,
      d.livros.map((c) => canon.livro(CodigoLivro.de(c))),
    ),
    fuzzy: d.fuzzy,
    ordenacao: d.ordenacao,
    pagina: d.pagina,
    tamanhoPagina: d.tamanhoPagina,
  });
}

export function paginaParaDTO(p: Pagina<ResultadoBusca>): PaginaDTO {
  return {
    itens: p.itens.map((r) => ({
      chave: r.referencia.chave(),
      texto: r.texto,
      ocorrencias: r.ocorrencias.map(({ de, ate }) => ({ de, ate })),
      pontuacao: r.pontuacao,
    })),
    pagina: p.pagina,
    tamanhoPagina: p.tamanhoPagina,
    total: p.total,
  };
}

export function paginaDeDTO(d: PaginaDTO, canon: Canon): Pagina<ResultadoBusca> {
  return new Pagina(
    d.itens.map((i) => ({
      referencia: Referencia.deChave(i.chave, canon),
      texto: i.texto,
      ocorrencias: i.ocorrencias,
      pontuacao: i.pontuacao,
    })),
    d.pagina,
    d.tamanhoPagina,
    d.total,
  );
}
