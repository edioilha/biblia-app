import { tokenizar } from './normalizacao';

/** Trecho de um versículo encontrado na busca: caracteres `[de, ate)`. */
export interface Ocorrencia {
  readonly de: number;
  readonly ate: number;
}

/**
 * RF02.8 — palavras do texto cujo termo normalizado está entre os termos casados pela busca
 * (inclui os casados por prefixo ou aproximação, que o índice informa).
 */
export function ocorrenciasDosTermos(texto: string, termos: Iterable<string>): Ocorrencia[] {
  const conjunto = new Set(termos);
  return tokenizar(texto)
    .filter((t) => conjunto.has(t.termo))
    .map(({ de, ate }) => ({ de, ate }));
}

/**
 * RF02.3 — cada ocorrência da frase (termos normalizados, nessa ordem e consecutivos). A
 * pontuação entre as palavras é ignorada: "Deus, que" casa com a frase "deus que".
 */
export function ocorrenciasDaFrase(texto: string, frase: readonly string[]): Ocorrencia[] {
  if (frase.length === 0) return [];
  const tokens = tokenizar(texto);
  const achadas: Ocorrencia[] = [];
  for (let i = 0; i + frase.length <= tokens.length; i++) {
    if (frase.every((termo, j) => tokens[i + j]?.termo === termo)) {
      const primeiro = tokens[i];
      const ultimo = tokens[i + frase.length - 1];
      if (primeiro && ultimo) achadas.push({ de: primeiro.de, ate: ultimo.ate });
      i += frase.length - 1;
    }
  }
  return achadas;
}
