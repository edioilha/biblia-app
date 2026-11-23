import { removerAcentos } from '../compartilhado/texto';

/** RF02.2 — minúsculas e sem acentos: "Coração" → "coracao". Usado no índice e na consulta. */
export function normalizarTermo(termo: string): string {
  return removerAcentos(termo.toLocaleLowerCase('pt-BR'));
}

/** Palavra do texto: posição original `[de, ate)` e termo normalizado. */
export interface Token {
  readonly termo: string;
  readonly de: number;
  readonly ate: number;
}

/**
 * Letras (com marcas combinantes) e números formam palavras; o resto separa. Hífen e
 * apóstrofo separam ("disse-lhe" → "disse", "lhe"), como no índice.
 */
const PALAVRA = /[\p{L}\p{M}\p{N}]+/gu;

/** Palavras do texto, na ordem, com a posição no texto original. */
export function tokenizar(texto: string): Token[] {
  return [...texto.matchAll(PALAVRA)].map((m) => ({
    termo: normalizarTermo(m[0]),
    de: m.index,
    ate: m.index + m[0].length,
  }));
}

/** Só as palavras (sem posição) — tokenizador do índice. */
export function palavras(texto: string): string[] {
  return texto.match(PALAVRA) ?? [];
}
