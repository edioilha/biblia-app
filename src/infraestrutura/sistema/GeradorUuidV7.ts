import { v7 } from 'uuid';
import type { GeradorId } from '../../aplicacao/portas';

/** UUID v7 (RFC 9562): ordenável por tempo; `crypto.randomUUID()` só gera v4. */
export class GeradorUuidV7 implements GeradorId {
  novo(): string {
    return v7();
  }
}
