/** Erro base da camada de aplicação (falhas de caso de uso, não de regra de domínio). */
export abstract class ErroAplicacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}
