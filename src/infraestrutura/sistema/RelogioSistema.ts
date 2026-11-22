import type { Relogio } from '../../aplicacao/portas';

export class RelogioSistema implements Relogio {
  agora(): Date {
    return new Date();
  }
}
