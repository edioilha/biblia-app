import { ErroDominio } from '../compartilhado/ErroDominio';
import { DADOS_CANON, type CodigoUsfm } from './dados-canon';

const CODIGOS = new Set<string>(DADOS_CANON.map(([codigo]) => codigo));

export class CodigoLivroInvalidoError extends ErroDominio {
  constructor(valor: string) {
    super(`Código de livro inválido: "${valor}".`);
  }
}

/** Código USFM de um livro do cânon (ex.: GEN, JHN, 1CO). */
export class CodigoLivro {
  private constructor(readonly valor: CodigoUsfm) {}

  static de(valor: string): CodigoLivro {
    const normalizado = valor.trim().toUpperCase();
    if (!CODIGOS.has(normalizado)) throw new CodigoLivroInvalidoError(valor);
    return new CodigoLivro(normalizado as CodigoUsfm);
  }

  equals(outro: CodigoLivro): boolean {
    return this.valor === outro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
