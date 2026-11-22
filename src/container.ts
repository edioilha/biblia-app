/**
 * Composition Root (ADR 0006).
 * Único ponto que conhece as implementações concretas: instancia os adapters
 * de infraestrutura e os injeta nos casos de uso. A UI consome apenas o que
 * é exportado daqui.
 */
import { Canon } from './dominio/biblia';
import type { Dependencias } from './ui/contexto/Dependencias';

export const dependencias: Dependencias = {
  canon: new Canon(),
};
