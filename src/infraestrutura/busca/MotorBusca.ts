import MiniSearch, { type SearchOptions, type SearchResult } from 'minisearch';
import { Referencia, type Canon, type Livro } from '../../dominio/biblia';
import {
  normalizarTermo,
  ocorrenciasDaFrase,
  ocorrenciasDosTermos,
  Pagina,
  palavras,
  type ConsultaBusca,
  type ResultadoBusca,
} from '../../dominio/busca';

/** Capítulo como está no banco: versículos [número, texto]. */
export interface CapituloParaIndice {
  readonly livro: string;
  readonly numero: number;
  readonly versiculos: readonly (readonly [numero: number, texto: string])[];
}

interface Documento {
  id: number;
  texto: string;
}

/** Prefixo só na última palavra e a partir de 3 letras ("amo" → amor, amou…). */
const PREFIXO_MINIMO = 3;
/** Aproximação só em palavras com 4+ letras (em "de", "o"… só traria ruído). */
const FUZZY_MINIMO = 4;
const FUZZY = 0.2;

/**
 * Índice full-text de uma versão (ADR 0005). Documento = versículo; id numérico codifica a
 * posição canônica (ordem do livro, capítulo, versículo), o que serve para ordenar e filtrar
 * sem guardar campos extras. Classe pura: roda no Web Worker e nos testes.
 */
export class MotorBusca {
  private constructor(
    private readonly canon: Canon,
    private readonly indice: MiniSearch<Documento>,
    private readonly textos: ReadonlyMap<number, string>,
  ) {}

  static construir(canon: Canon, capitulos: Iterable<CapituloParaIndice>): MotorBusca {
    const ordem = new Map<string, number>(canon.livros().map((l) => [l.codigo.valor, l.ordem]));
    const textos = new Map<number, string>();
    for (const c of capitulos) {
      const o = ordem.get(c.livro);
      if (o === undefined) continue;
      for (const [n, texto] of c.versiculos) textos.set(idDe(o, c.numero, n), texto);
    }
    const indice = new MiniSearch<Documento>({
      fields: ['texto'],
      tokenize: palavras,
      processTerm: normalizarTermo,
    });
    indice.addAll([...textos].map(([id, texto]) => ({ id, texto })));
    return new MotorBusca(canon, indice, textos);
  }

  get totalVersiculos(): number {
    return this.textos.size;
  }

  buscar(consulta: ConsultaBusca): Pagina<ResultadoBusca> {
    if (!consulta.pesquisavel) return Pagina.vazia(consulta.tamanhoPagina);
    const frase = consulta.modo === 'FRASE_EXATA';
    const filtro = consulta.filtro;
    const opcoes: SearchOptions = {
      combineWith: consulta.modo === 'QUALQUER_PALAVRA' ? 'OR' : 'AND',
      prefix: frase
        ? false
        : (termo, i, termos) => i === termos.length - 1 && termo.length >= PREFIXO_MINIMO,
      fuzzy: consulta.fuzzy && !frase ? (termo) => termo.length >= FUZZY_MINIMO && FUZZY : false,
      ...(filtro.vazio ? {} : { filter: (r: SearchResult) => filtro.aceita(this.livroDe(r.id)) }),
    };

    let achados = this.indice.search(consulta.termos.join(' '), opcoes);
    if (frase) {
      achados = achados.filter((r) => ocorrenciasDaFrase(this.texto(r.id), consulta.termos).length);
    }
    if (consulta.ordenacao === 'CANONICA') {
      achados = achados.toSorted((a, b) => (a.id as number) - (b.id as number));
    }

    const pagina = Pagina.de(achados, consulta.pagina, consulta.tamanhoPagina);
    return new Pagina(
      pagina.itens.map((r) => this.resultado(r, consulta)),
      pagina.pagina,
      pagina.tamanhoPagina,
      pagina.total,
    );
  }

  private resultado(r: SearchResult, consulta: ConsultaBusca): ResultadoBusca {
    const id = r.id as number;
    const texto = this.texto(id);
    const livro = this.livroDe(id);
    return {
      referencia: Referencia.versiculo(livro, Math.floor(id / 1000) % 1000, id % 1000),
      texto,
      ocorrencias:
        consulta.modo === 'FRASE_EXATA'
          ? ocorrenciasDaFrase(texto, consulta.termos)
          : ocorrenciasDosTermos(texto, r.terms),
      pontuacao: r.score,
    };
  }

  private texto(id: unknown): string {
    return this.textos.get(id as number) ?? '';
  }

  private livroDe(id: unknown): Livro {
    const livro = this.canon.livros()[Math.floor((id as number) / 1_000_000) - 1];
    if (!livro) throw new Error(`Documento de busca inválido: ${String(id)}.`);
    return livro;
  }
}

/** Ordem do livro (1–66), capítulo (< 1000) e versículo (< 1000) num único número. */
function idDe(ordem: number, capitulo: number, versiculo: number): number {
  return ordem * 1_000_000 + capitulo * 1000 + versiculo;
}
