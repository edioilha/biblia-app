/** Minúsculas, sem acentos, sem espaços nem pontos — para comparar entradas do usuário. */
export function normalizarChave(texto: string): string {
  return removerAcentos(texto.toLocaleLowerCase('pt-BR')).replace(/[\s.]+/g, '');
}

/** Minúsculas e sem espaços/pontos, preservando acentos. */
export function chaveComAcentos(texto: string): string {
  return texto
    .toLocaleLowerCase('pt-BR')
    .normalize('NFC')
    .replace(/[\s.]+/g, '');
}

export function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
