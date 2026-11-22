/**
 * Normalização e validação do JSON canônico do biblia.data para o formato embarcado
 * do app (public/dados/<SIGLA>/<LIVRO>.json). Funções puras — testadas em normalizar.test.ts.
 */

/** Formato de origem: data/canonical/<SIGLA>/<LIVRO>.json no Projeto-Euaggelion/biblia.data. */
export interface LivroOrigem {
  id: number;
  code: string;
  name: string;
  abbrev: string;
  chapters: { number: number; verses: { number: number; text: string }[] }[];
}

/** Versículo embarcado: [número, texto]. O número é explícito porque há lacunas (ex.: Sl 46:3). */
export type VersiculoEmbarcado = [number, string];

/** Formato embarcado, compacto: `capitulos[i]` é o capítulo i + 1. */
export interface LivroEmbarcado {
  formato: 1;
  livro: string;
  capitulos: VersiculoEmbarcado[][];
}

export const FORMATO_EMBARCADO = 1;

/** Markup de nota de rodapé que vazou para o texto na fonte (ex.: Dt 32:5: "/fn/key…/*fn"). */
const NOTA_VAZADA = /\/fn\/.*?\/\*fn/gu;
/** Pontuação colada na palavra seguinte ("destruição,diz", "mim.Porém", "(Selá)Porque"). */
const PONTUACAO_COLADA = /([,;:.!?)])(?=\p{L})/gu;

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFC')
    .replace(NOTA_VAZADA, ' ')
    .replace(/´/gu, '’')
    .replace(PONTUACAO_COLADA, '$1 ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export class DadosInvalidosError extends Error {}

/**
 * Converte um livro de origem para o formato embarcado, validando contra o cânon:
 * código esperado, total de capítulos, capítulos sequenciais, versículos crescentes e não vazios.
 */
export function converterLivro(
  origem: LivroOrigem,
  esperado: { codigo: string; totalCapitulos: number },
): LivroEmbarcado {
  const erro = (msg: string) => new DadosInvalidosError(`${esperado.codigo}: ${msg}`);

  if (origem.code !== esperado.codigo) throw erro(`código inesperado "${origem.code}".`);
  if (origem.chapters.length !== esperado.totalCapitulos) {
    throw erro(`${origem.chapters.length} capítulos; esperado ${esperado.totalCapitulos}.`);
  }

  const capitulos = origem.chapters.map((cap, i) => {
    if (cap.number !== i + 1)
      throw erro(`capítulo ${cap.number} fora de ordem (posição ${i + 1}).`);
    if (cap.verses.length === 0) throw erro(`capítulo ${cap.number} sem versículos.`);

    let anterior = 0;
    return cap.verses.map((v): VersiculoEmbarcado => {
      if (!Number.isInteger(v.number) || v.number <= anterior) {
        throw erro(`${cap.number}:${v.number} fora de ordem.`);
      }
      anterior = v.number;
      const texto = normalizarTexto(v.text);
      if (!texto) throw erro(`${cap.number}:${v.number} vazio.`);
      return [v.number, texto];
    });
  });

  return { formato: FORMATO_EMBARCADO, livro: esperado.codigo, capitulos };
}
