/** Gera identificadores únicos ordenáveis por tempo (UUID v7 — docs/04 §1). */
export interface GeradorId {
  novo(): string;
}
