/** Erro base para violações de regras de negócio. */
export abstract class ErroDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}
