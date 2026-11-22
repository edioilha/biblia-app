import { ErroDominio } from '../compartilhado/ErroDominio';
import type { Canon } from './Canon';
import { CodigoLivro } from './CodigoLivro';
import type { Livro } from './Livro';

export class ReferenciaInvalidaError extends ErroDominio {}

// "<livro> <capítulo>[:|.|, <versículo>]" — o livro pode ter número e espaços ("1 Co", "Lamentações de Jeremias")
const PADRAO = /^(.*?)\s*(\d+)(?:\s*[:.,]\s*(\d+))?\s*$/u;

/**
 * Value object que aponta para um capítulo ou versículo, independente da versão.
 * Imutável. Chave de persistência: "JHN.3" ou "JHN.3.16".
 */
export class Referencia {
  private constructor(
    readonly livro: CodigoLivro,
    readonly capitulo: number,
    readonly versiculo: number | null,
  ) {}

  static capitulo(livro: Livro, capitulo: number): Referencia {
    return Referencia.criar(livro, capitulo, null);
  }

  static versiculo(livro: Livro, capitulo: number, versiculo: number): Referencia {
    return Referencia.criar(livro, capitulo, versiculo);
  }

  /**
   * Interpreta o texto digitado pelo usuário.
   * Aceita "Jo 3:16", "joão 3.16", "jo 3", "1 co 13", "Sl 23", "gênesis" (= capítulo 1).
   */
  static parse(texto: string, canon: Canon): Referencia {
    const entrada = texto.trim();
    if (!entrada) throw new ReferenciaInvalidaError('Informe uma referência (ex.: Jo 3:16).');

    const m = PADRAO.exec(entrada);
    const nomeLivro = m ? (m[1] ?? '') : entrada;
    if (!nomeLivro.trim()) throw new ReferenciaInvalidaError(`Referência sem livro: "${texto}".`);

    const livro = canon.porNomeOuAbreviacao(nomeLivro);
    const capitulo = m?.[2] ? Number(m[2]) : 1;
    const versiculo = m?.[3] ? Number(m[3]) : null;
    return Referencia.criar(livro, capitulo, versiculo);
  }

  /** Inverso de `chave()`: "JHN.3" ou "JHN.3.16". */
  static deChave(chave: string, canon: Canon): Referencia {
    const [codigo = '', capitulo, versiculo, ...resto] = chave.split('.');
    if (capitulo === undefined || resto.length > 0) {
      throw new ReferenciaInvalidaError(`Chave de referência inválida: "${chave}".`);
    }
    const livro = canon.livro(CodigoLivro.de(codigo));
    return Referencia.criar(
      livro,
      Number(capitulo),
      versiculo === undefined ? null : Number(versiculo),
    );
  }

  private static criar(livro: Livro, capitulo: number, versiculo: number | null): Referencia {
    if (!livro.possuiCapitulo(capitulo)) {
      throw new ReferenciaInvalidaError(
        `${livro.nome} tem ${livro.totalCapitulos} capítulo(s); capítulo ${capitulo} não existe.`,
      );
    }
    if (versiculo !== null && (!Number.isInteger(versiculo) || versiculo < 1)) {
      throw new ReferenciaInvalidaError(`Versículo inválido: ${versiculo}.`);
    }
    return new Referencia(livro.codigo, capitulo, versiculo);
  }

  /** A referência do capítulo, sem versículo ("Jo 3:16" → "Jo 3"). */
  doCapitulo(): Referencia {
    return this.versiculo === null ? this : new Referencia(this.livro, this.capitulo, null);
  }

  /** Chave de persistência: "JHN.3" ou "JHN.3.16". */
  chave(): string {
    const base = `${this.livro.valor}.${this.capitulo}`;
    return this.versiculo === null ? base : `${base}.${this.versiculo}`;
  }

  /** Texto para exibição: "João 3" ou "João 3:16". */
  formatar(livro: Livro): string {
    const base = `${livro.nome} ${this.capitulo}`;
    return this.versiculo === null ? base : `${base}:${this.versiculo}`;
  }

  equals(outra: Referencia): boolean {
    return this.chave() === outra.chave();
  }

  /** Negativo se `this` vem antes de `outra` na ordem canônica. */
  compararCom(outra: Referencia, canon: Canon): number {
    return (
      canon.livro(this.livro).ordem - canon.livro(outra.livro).ordem ||
      this.capitulo - outra.capitulo ||
      (this.versiculo ?? 0) - (outra.versiculo ?? 0)
    );
  }
}
