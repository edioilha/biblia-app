import type { Referencia } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';

export class IntervaloTextoInvalidoError extends ErroDominio {}

/**
 * Ponto no texto de um versículo: `offset` conta caracteres (unidades UTF-16, como o DOM)
 * a partir do início do texto do versículo, sem o número.
 */
export class PosicaoTexto {
  private constructor(
    readonly versiculo: Referencia,
    readonly offset: number,
  ) {}

  static em(versiculo: Referencia, offset: number): PosicaoTexto {
    if (versiculo.versiculo === null) {
      throw new IntervaloTextoInvalidoError(
        `Posição exige um versículo; "${versiculo.chave()}" é um capítulo.`,
      );
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new IntervaloTextoInvalidoError(`Offset inválido: ${offset}.`);
    }
    return new PosicaoTexto(versiculo, offset);
  }

  /** Número do versículo. */
  get numero(): number {
    return this.versiculo.versiculo ?? 0;
  }

  /** Negativo se `this` vem antes de `outra`. Só compara posições do mesmo capítulo. */
  compararCom(outra: PosicaoTexto): number {
    if (!this.versiculo.doCapitulo().equals(outra.versiculo.doCapitulo())) {
      throw new IntervaloTextoInvalidoError(
        `Posições de capítulos diferentes: ${this.versiculo.chave()} e ${outra.versiculo.chave()}.`,
      );
    }
    return this.numero - outra.numero || this.offset - outra.offset;
  }

  equals(outra: PosicaoTexto): boolean {
    return this.versiculo.equals(outra.versiculo) && this.offset === outra.offset;
  }
}

/** Trecho de um versículo: caracteres `[de, ate)`. */
export interface Faixa {
  readonly de: number;
  readonly ate: number;
}

/**
 * Trecho de texto `[inicio, fim)` dentro de **um capítulo** (a página mostra um capítulo por
 * vez). Pode cobrir parte de um versículo ou vários (RF04.2). Imutável e nunca vazio
 * (`inicio < fim`). Os offsets são validados contra o texto em `TextoDoCapitulo`.
 */
export class IntervaloTexto {
  private constructor(
    readonly inicio: PosicaoTexto,
    readonly fim: PosicaoTexto,
  ) {}

  static criar(inicio: PosicaoTexto, fim: PosicaoTexto): IntervaloTexto {
    if (!inicio.versiculo.doCapitulo().equals(fim.versiculo.doCapitulo())) {
      throw new IntervaloTextoInvalidoError(
        `Um intervalo de texto fica dentro de um capítulo: ${inicio.versiculo.chave()} → ${fim.versiculo.chave()}.`,
      );
    }
    if (inicio.compararCom(fim) >= 0) {
      throw new IntervaloTextoInvalidoError('O início do intervalo deve vir antes do fim.');
    }
    return new IntervaloTexto(inicio, fim);
  }

  /** Referência do capítulo (sem versículo). */
  get capitulo(): Referencia {
    return this.inicio.versiculo.doCapitulo();
  }

  /** Têm caracteres em comum (só encostar não é sobrepor). */
  sobrepoe(outro: IntervaloTexto): boolean {
    return (
      this.capitulo.equals(outro.capitulo) &&
      this.inicio.compararCom(outro.fim) < 0 &&
      outro.inicio.compararCom(this.fim) < 0
    );
  }

  /** Menor intervalo que cobre os dois (do mesmo capítulo). */
  unir(outro: IntervaloTexto): IntervaloTexto {
    const inicio = this.inicio.compararCom(outro.inicio) <= 0 ? this.inicio : outro.inicio;
    const fim = this.fim.compararCom(outro.fim) >= 0 ? this.fim : outro.fim;
    return new IntervaloTexto(inicio, fim);
  }

  /** O que sobra de `this` sem `outro`: nenhum, um ou dois pedaços, em ordem. */
  subtrair(outro: IntervaloTexto): IntervaloTexto[] {
    if (!this.sobrepoe(outro)) return [this];
    const pedacos: IntervaloTexto[] = [];
    if (this.inicio.compararCom(outro.inicio) < 0) {
      pedacos.push(new IntervaloTexto(this.inicio, outro.inicio));
    }
    if (outro.fim.compararCom(this.fim) < 0) {
      pedacos.push(new IntervaloTexto(outro.fim, this.fim));
    }
    return pedacos;
  }

  /** Parte do versículo `numero` (de texto com `tamanho` caracteres) coberta, ou `null`. */
  trechoNoVersiculo(numero: number, tamanho: number): Faixa | null {
    if (numero < this.inicio.numero || numero > this.fim.numero) return null;
    const de = Math.min(numero === this.inicio.numero ? this.inicio.offset : 0, tamanho);
    const ate = Math.min(numero === this.fim.numero ? this.fim.offset : tamanho, tamanho);
    return de < ate ? { de, ate } : null;
  }

  equals(outro: IntervaloTexto): boolean {
    return this.inicio.equals(outro.inicio) && this.fim.equals(outro.fim);
  }
}
