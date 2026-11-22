import type { CodigoLivro } from './CodigoLivro';
import type { Testamento } from './Testamento';

export class Livro {
  constructor(
    readonly codigo: CodigoLivro,
    readonly ordem: number,
    readonly nome: string,
    readonly abreviacao: string,
    readonly testamento: Testamento,
    readonly totalCapitulos: number,
  ) {}

  possuiCapitulo(numero: number): boolean {
    return Number.isInteger(numero) && numero >= 1 && numero <= this.totalCapitulos;
  }
}
