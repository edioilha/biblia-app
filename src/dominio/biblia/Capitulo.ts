import { ErroDominio } from '../compartilhado/ErroDominio';
import type { CodigoLivro } from './CodigoLivro';
import type { Livro } from './Livro';
import { Referencia } from './Referencia';
import type { VersaoId } from './Versao';

export class CapituloInvalidoError extends ErroDominio {}

/** Texto de um versículo em uma versão. Imutável. */
export class Versiculo {
  constructor(
    readonly referencia: Referencia,
    readonly texto: string,
  ) {}

  get numero(): number {
    // Sempre presente: Versiculo só é criado por Capitulo.criar com Referencia.versiculo().
    return this.referencia.versiculo ?? 0;
  }
}

/**
 * Capítulo de um livro em uma versão. A numeração dos versículos pode ter lacunas
 * (ex.: Sl 46 na BLIVRE não tem o v. 3), por isso cada versículo guarda seu número.
 */
export class Capitulo {
  private constructor(
    readonly versaoId: VersaoId,
    readonly referencia: Referencia,
    readonly versiculos: readonly Versiculo[],
  ) {}

  static criar(
    versaoId: VersaoId,
    livro: Livro,
    numero: number,
    versiculos: readonly (readonly [numero: number, texto: string])[],
  ): Capitulo {
    const referencia = Referencia.capitulo(livro, numero);
    if (versiculos.length === 0) {
      throw new CapituloInvalidoError(`${referencia.formatar(livro)} não tem versículos.`);
    }

    let anterior = 0;
    const lista = versiculos.map(([n, texto]) => {
      if (n <= anterior) {
        throw new CapituloInvalidoError(
          `${referencia.formatar(livro)}: versículo ${n} fora de ordem.`,
        );
      }
      anterior = n;
      return new Versiculo(Referencia.versiculo(livro, numero, n), texto);
    });
    return new Capitulo(versaoId, referencia, lista);
  }

  get livro(): CodigoLivro {
    return this.referencia.livro;
  }

  get numero(): number {
    return this.referencia.capitulo;
  }

  versiculo(numero: number): Versiculo | undefined {
    return this.versiculos.find((v) => v.numero === numero);
  }
}
