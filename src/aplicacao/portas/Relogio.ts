/** Fonte do instante atual (porta para testes determinísticos). */
export interface Relogio {
  agora(): Date;
}
