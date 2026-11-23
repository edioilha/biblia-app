const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

/** Normaliza (trim + minúsculas) e devolve o UUID, ou `null` se o formato for inválido. */
export function normalizarUuid(valor: string): string | null {
  const id = valor.trim().toLowerCase();
  return UUID.test(id) ? id : null;
}
